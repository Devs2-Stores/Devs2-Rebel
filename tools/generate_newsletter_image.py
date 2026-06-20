#!/usr/bin/env python3
"""
Generate newsletter popup image via Black Forest Flux 2.0 Pro,
upload to Shopify Admin API, and update theme settings.

Prerequisites: .env with BFL_API_KEY, SHOPIFY_STORE, SHOPIFY_TOKEN
Usage: python tools/generate_newsletter_image.py
"""

import os
import json
import time
import sys
from pathlib import Path
from io import BytesIO
import requests

ROOT = Path(__file__).resolve().parent.parent

# ── Load .env ─────────────────────────────────────────────────
def load_env():
    """Load .env file if present (local dev). On CI, env vars are already set."""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return  # CI: env vars set by workflow
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, val = line.partition("=")
            key, val = key.strip(), val.strip()
            if key not in os.environ:
                os.environ[key] = val

load_env()

BFL_KEY = os.environ.get("BFL_API_KEY")
SHOP = os.environ.get("SHOPIFY_STORE")
TOKEN = os.environ.get("SHOPIFY_TOKEN")
API_VER = os.environ.get("SHOPIFY_API_VERSION", "2025-01")

if not all([BFL_KEY, SHOP, TOKEN]):
    print("❌ Missing env: BFL_API_KEY, SHOPIFY_STORE, SHOPIFY_TOKEN")
    sys.exit(1)

# ── Black Forest Flux 2.0 Pro — generate image ─────────────────
def generate_image():
    """Generate fashion newsletter image using Black Forest Flux 2.0 Pro"""
    print("🎨 Generating image with Black Forest Flux 2.0 Pro...")

    prompt = (
        "A luxury fashion editorial photograph for a high-end brand newsletter "
        "subscription popup. Model wearing an elegant, structured crimson wool coat, "
        "standing against a soft cream art gallery wall with dramatic natural "
        "side-lighting casting architectural shadows. Minimalist composition with "
        "generous negative space on the right side for text overlay. The mood is "
        "refined, quiet luxury, cinema-grade color grading with warm cream tones "
        "and deep crimson accents. Shot on medium format film, shallow depth of "
        "field, editorial fashion aesthetic. The garment: tailored crimson coat "
        "with sharp shoulders, visible hand-stitching detail, raw silk lapel. "
        "Empty copy space on the right 40% of the frame for newsletter text. "
        "No text, no logo, no words in the image. "
        "Vertical orientation, 3:4 aspect ratio, suitable for a popup banner."
    )

    # Try multiple BFL API endpoints
    endpoints = [
        "https://api.us1.bfl.ai/v1/flux-pro-2.0",
        "https://api.bfl.ml/v1/flux-pro-2.0",
    ]

    for endpoint in endpoints:
        try:
            print(f"   Trying: {endpoint}")
            resp = requests.post(
                endpoint,
                headers={
                    "Content-Type": "application/json",
                    "X-Key": BFL_KEY,
                    "Accept": "application/json",
                },
                json={
                    "prompt": prompt,
                    "width": 1024,
                    "height": 1365,          # 3:4 portrait
                    "steps": 50,              # max quality
                    "guidance": 4.0,
                    "prompt_upsampling": True,
                    "safety_tolerance": 2,
                    "output_format": "jpeg",
                    "response_format": "url",
                },
                timeout=120,
            )

            if resp.status_code == 200:
                data = resp.json()
                # BFL API returns {id, status, result: {sample: url}} or similar
                url = None
                if "result" in data:
                    url = data["result"].get("sample") or data["result"].get("url")
                if not url:
                    url = data.get("sample") or data.get("url")
                if url:
                    print(f"✅ Image generated: {data.get('id', 'unknown')}")
                    return url
                else:
                    print(f"   Unexpected response: {json.dumps(data, indent=2)[:300]}")
            else:
                print(f"   HTTP {resp.status_code}: {resp.text[:200]}")
        except requests.exceptions.Timeout:
            print(f"   Timeout (120s)")
        except requests.exceptions.ConnectionError as e:
            print(f"   Connection error: {e}")
        except Exception as e:
            print(f"   Error: {e}")

    raise RuntimeError("All BFL API endpoints failed. Network may be blocking these services.")

# ── Download image ────────────────────────────────────────────
def download_image(url):
    """Download generated image to buffer"""
    print("📥 Downloading image...")
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()

    # Save locally for reference
    output_dir = ROOT / "output"
    output_dir.mkdir(exist_ok=True)
    local_path = output_dir / "newsletter-popup-banner.jpg"
    local_path.write_bytes(resp.content)
    print(f"💾 Saved locally: {local_path}")
    return resp.content

# ── Shopify GraphQL helper ────────────────────────────────────
def shopify_graphql(query, variables=None):
    """Execute a Shopify Admin GraphQL query"""
    url = f"https://{SHOP}/admin/api/{API_VER}/graphql.json"
    resp = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": TOKEN,
        },
        json={"query": query, "variables": variables or {}},
        timeout=30,
    )
    data = resp.json()
    if "errors" in data:
        raise RuntimeError(f"GraphQL errors: {json.dumps(data['errors'], indent=2)}")
    return data["data"]

# ── Shopify: staged upload + file create ──────────────────────
def upload_to_shopify(image_bytes, filename="newsletter-banner.jpg"):
    """Upload image to Shopify Files via staged uploads"""
    print("📤 Uploading to Shopify...")

    # Step 1: Request staged upload URL
    print("   1/3 Requesting upload URL...")
    staged_query = """
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
            stagedTargets {
                url
                resourceUrl
                parameters {
                    name
                    value
                }
            }
            userErrors { field message }
        }
    }
    """
    staged_result = shopify_graphql(staged_query, {
        "input": [{
            "resource": "FILE",
            "filename": filename,
            "mimeType": "image/jpeg",
            "fileSize": str(len(image_bytes)),
            "httpMethod": "POST",
        }]
    })

    target = staged_result["stagedUploadsCreate"]["stagedTargets"][0]
    user_errors = staged_result["stagedUploadsCreate"].get("userErrors", [])
    if user_errors:
        raise RuntimeError(f"Staged upload errors: {user_errors}")

    # Step 2: Upload file to staged URL (multipart form)
    print("   2/3 Uploading to staging...")
    files = {}
    form_data = {}
    for param in target["parameters"]:
        form_data[param["name"]] = param["value"]
    # The file field is typically the last parameter
    files["file"] = (filename, BytesIO(image_bytes), "image/jpeg")

    upload_resp = requests.post(
        target["url"],
        data=form_data,
        files=files,
        timeout=60,
    )
    if upload_resp.status_code not in range(200, 300):
        raise RuntimeError(f"Staging upload failed: {upload_resp.status_code} {upload_resp.text[:300]}")

    resource_url = target["resourceUrl"]
    print(f"   ✅ Staged upload OK")

    # Step 3: Create file in Shopify
    print("   3/3 Creating file in Shopify...")
    file_query = """
    mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
            files {
                id
                ... on MediaImage {
                    image { url altText width height }
                }
            }
            userErrors { field message }
        }
    }
    """
    file_result = shopify_graphql(file_query, {
        "files": [{
            "alt": "Luxury fashion newsletter banner",
            "contentType": "IMAGE",
            "originalSource": resource_url,
        }]
    })

    errors = file_result["fileCreate"].get("userErrors", [])
    if errors:
        raise RuntimeError(f"File create errors: {errors}")

    file_data = file_result["fileCreate"]["files"][0]
    image_url = file_data.get("image", {}).get("url", resource_url)
    print(f"   🛍️  Shopify CDN URL: {image_url}")
    return image_url

# ── Update settings_data.json ─────────────────────────────────
def update_settings(image_url):
    """Set newsletter_modal_image in settings_data.json"""
    settings_path = ROOT / "config" / "settings_data.json"
    with open(settings_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    preset_key = data.get("current", "Devs2")
    preset = data["presets"].get(preset_key)
    if not preset:
        raise RuntimeError(f'Preset "{preset_key}" not found in settings_data.json')

    preset["newsletter_modal_image"] = image_url
    preset["newsletter_modal_enable"] = True  # auto-enable popup

    with open(settings_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"✅ Updated settings_data.json")
    print(f"   newsletter_modal_image = {image_url}")
    print(f"   newsletter_modal_enable = true")

# ── MAIN ──────────────────────────────────────────────────────
def main():
    try:
        # 1. Generate image with Flux 2.0 Pro
        image_url = generate_image()

        # 2. Download to buffer
        image_bytes = download_image(image_url)

        # 3. Upload to Shopify
        cdn_url = upload_to_shopify(image_bytes)

        # 4. Update theme settings
        update_settings(cdn_url)

        print("\n🎉 Done! Newsletter popup image ready.")
        print("   Refresh http://127.0.0.1:9292 to see it.")
        print("   (Clear newsletter cookie to re-trigger the popup)")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

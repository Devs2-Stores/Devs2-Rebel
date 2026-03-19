window.ThemeSearch || (window.ThemeSearch = {});
ThemeSearch.Operators = {
  OR: "OR",
  AND: "AND",
  NOT: "NOT"
};
ThemeSearch.PRICE_FIELD = 'price_variant';
ThemeSearch.COLLECTION_FIELD = 'collectionid';
ThemeSearch.SearchField = function() {
  function SearchField(name) {
    this.name = name;
    this.values = [];
  }
  SearchField.prototype.addValue = function(value, operator) {
    if (this.name === ThemeSearch.PRICE_FIELD) {
      this.values = [{
        value: value,
        operator: operator
      }];
      return;
    }
    this.values.push({
      value: value,
      operator: operator
    });
  };
  SearchField.prototype.deleteValue = function(value) {
    var index = -1;
    for (var i = 0; i < this.values.length; i++) {
      if (this.values[i].value === value) {
        index = i;
        break;
      }
    }
    if (index > -1) {
      this.values.splice(index, 1);
    }
  };
  SearchField.prototype.buildParam = function() {
    if (this.values.length === 0) return null;
    var name = this.name;
    if (name === ThemeSearch.COLLECTION_FIELD) {
      return '(collectionid:product>=' + this.values[0].value + ')';
    }
    if (name === ThemeSearch.PRICE_FIELD) {
      return '(price_variant:product range ' + this.values[0].value + ')';
    }
    var parts = this.values.map(function(val) {
      return '(' + name + ':product=' + val.value + ')';
    });
    return '(' + parts.join('||') + ')';
  };
  return SearchField;
}();
ThemeSearch.SearchFilter = function() {
  function SearchFilter() {
    this.fields = {};
  }
  SearchFilter.prototype.addValue = function(group, field, value, operator) {
    var searchField = this.findOrCreateField(group, field);
    return searchField.addValue(value, operator);
  };
  SearchFilter.prototype.findOrCreateField = function(group, field) {
    var searchField = this.fields[group];
    if (!searchField) {
      searchField = new ThemeSearch.SearchField(field);
      this.fields[group] = searchField;
    }
    return searchField;
  };
  SearchFilter.prototype.deleteValue = function(group, field, value, operator) {
    var searchField = this.findOrCreateField(group, field);
    return searchField.deleteValue(value, operator);
  };
  SearchFilter.prototype.deleteGroup = function(group) {
    delete this.fields[group];
  };
  SearchFilter.prototype.search = function(settings) {
    if (!settings) settings = {};
    var url = this.buildSearchUrl(settings);
    if (settings.success) {
      this._search(url, settings.success);
    }
  };
  SearchFilter.prototype.buildSearchUrl = function(settings) {
    if (!settings) settings = {};
    var url = this._buildSearchUrl();
    if (settings.view) url += "&view=" + settings.view;
    if (settings.page) url += "&page=" + settings.page;
    if (settings.sortby) url += "&sortby=" + settings.sortby;
    return url;
  };
  SearchFilter.prototype._buildSearchUrl = function() {
    var parts = [];
    if (this.fields[ThemeSearch.COLLECTION_FIELD]) {
      var colParam = this.fields[ThemeSearch.COLLECTION_FIELD].buildParam();
      if (colParam) parts.push(colParam);
    }
    for (var group in this.fields) {
      if (!this.fields.hasOwnProperty(group)) continue;
      if (group === ThemeSearch.COLLECTION_FIELD) continue;
      var param = this.fields[group].buildParam();
      if (param) parts.push(param);
    }
    if (parts.length === 0) return '/search?q=';
    var filterExpr = 'filter=' + parts.join('&&');
    return '/search?q=' + encodeURIComponent(filterExpr);
  };
  SearchFilter.prototype._search = function(url, callback) {
    fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html'
        }
      })
      .then(function(response) {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
      })
      .then(function(html) {
        if (callback) callback(html);
      })
      .catch(function(error) {
        console.error('Search filter error:', error);
      });
  };
  SearchFilter.containsOperator = function(value) {
    if (value.indexOf(ThemeSearch.Operators.OR) > 0) return true;
    if (value.indexOf(ThemeSearch.Operators.AND) > 0) return true;
    return false;
  };
  return SearchFilter;
}();
/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('SearchCtrl', function($scope, $http, $location, $stateParams, $rootScope) {

  $scope.query = {};
  $scope.untouched = true;

  // setup for free search by section
  $scope.freeSearchSections = { biography: true, tours: true, narrative: true, notes: true };

  // setup for travel date range search
  $scope.resetTravelDateModel = function(type) {
    travelDateModel = { queryType: type, query: {} };
    $scope.travelDateModel = travelDateModel;
    delete $scope.query.travel_date;
  };
  var travelDateModel;
  $scope.resetTravelDateModel('exact');

  if($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    $scope.searching = true;
    $http.post('/api/entries/search2', {
        query: $scope.query
      }
    )
    .success(function(res){
      $scope.searching = false;
      $scope.entries = res.entries;
      if (res.entries.length) $scope.noResults = false;
      else $scope.noResults = true;
    });

    //  setup for free search by section
    if ($scope.query.entry) {
      for (var k in $scope.freeSearchSections) {
        if ($scope.query.entry[k]) $scope.freeSearchQuery = $scope.query.entry[k];
        else $scope.freeSearchSections[k] = false;
      }
    }

    //  setup for travel date range search
    if ($scope.query.travel_date) {
      if ($scope.query.travel_date.startYear !== $scope.query.travel_date.endYear ||
          $scope.query.travel_date.startMonth !== $scope.query.travel_date.endMonth ||
          $scope.query.travel_date.startDay !== $scope.query.travel_date.endDay) {
        travelDateModel.queryType = 'range';
      }
      travelDateModel.query = $scope.query.travel_date;
    }
  }

  //  support for free search by section
  $scope.$watch('freeSearchQuery', function(newValue) {
    for (var section in $scope.freeSearchSections) {
      if ($scope.freeSearchSections[section] && $scope.freeSearchQuery) {
        if (!$scope.query.entry) $scope.query.entry = {};
        $scope.query.entry[section] = $scope.freeSearchQuery;
      }
    }
  });

  $scope.$watchCollection('freeSearchSections', function(newValues) {
    for (var section in $scope.freeSearchSections) {
      if ($scope.freeSearchSections[section] && $scope.freeSearchQuery) {
        if (!$scope.query.entry) $scope.query.entry = {};
        $scope.query.entry[section] = $scope.freeSearchQuery;
      }
      else if ($scope.query.entry) {
        delete $scope.query.entry[section];
        if (Object.keys($scope.query.entry).length === 0) delete $scope.query.entry;
      }
    }
  });

  //  support for travel date range search
  $scope.$watchCollection('travelDateModel.query', function(query) {
    if (travelDateModel.queryType === 'exact') {
      query.endYear = query.startYear;
      query.endMonth = query.startMonth;
      query.endDay = query.startDay;
    }
    for (key in query) if (!query[key]) delete query[key];
    if (Object.getOwnPropertyNames(query).length > 0) $scope.query.travel_date = query;
    else delete $scope.query.travel_date;
  });

  $scope.search = function(){
    $location.path('search/' + JSON.stringify(clean($scope.query)) );
  }

  $scope.$watch('query', function(query){
    for (var k in query){
      if (!/\S/.test(query[k])) delete query[k]
    }
    $scope.untouched = Object.getOwnPropertyNames(query).length == 0;
  }, true)



  $scope.getSuggestions = function(field, value){
    return $http.post('/api/entries/suggest/', {  field : field, value : value })
    .then(function (res){
      return res.data.results;//.map(function(d){ return { value: d } });
    })
  }

  function clean(obj){

    for (var key in obj) {
      if (!last(obj[key])) delete obj[key];
    }

    function last(o){
      for (var k in o) {
        if (typeof o[k] == 'object') return last(o[k]);
        else return /\S/.test(o.value) ? o[k] : null;
      }
    }

    return obj;
  }

  $scope.clear = function(){
    $scope.query = {};
    $scope.entries = [];
  }

  $('.tooltip').remove();

  $scope.downloadLists = function() {
    if (!$scope.lists) {
      $scope.loadingLists = true;
      $http.post('/api/lists/mylists', {
        username: $rootScope.currentUser.username
      })
      .success(function(res) {
        if (res.error) console.error(res.error);
        else $scope.lists = res.entries;
        $scope.loadingLists = false;
      });
    }
  };

  $scope.addToList = function(list, entry) {
    if (list.entryIDs.indexOf(entry.index) === -1) {
      $http.post('/api/lists/addtolist', {
        username: $rootScope.currentUser.username,
        listID: list._id,
        entryIndex: entry.index
      })
      .success(function(res) {
        if (res.error) console.error(error);
        else {
          list.entryIDs.push(entry.index);
          entry.success = true;
        }
      });
    } else entry.alreadyInList = true;
  };

});

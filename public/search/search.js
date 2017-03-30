/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('SearchCtrl', function($scope, $http, $location, $stateParams, listService, entryHighlightingService) {

  $scope.query = {};
  $scope.untouched = true;

  // setup for free search by section
  $scope.freeSearchSections = { biography: true, tours: true, narrative: true, notes: true };
  $scope.freeSearchBeginnings = true;

  // setup for travel date range search
  $scope.resetTravelDate = function(type) {
    travelDate = { queryType: type, query: {} };
    travelModel.date = travelDate;
  };
  var travelModel = { date: {}, place: '' };
  $scope.travelModel = travelModel;
  $scope.resetTravelDate('exact', false);

  if($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    $scope.searching = true;
    $http.post('/api/entries/search2', {
        query: $scope.query
      }
    )
    .success(function(res){

      if (res.error) console.error(res.error);

      entryHighlightingService.saveQuery(res.request)
      $scope.searching = false;
      $scope.entries = res.entries;
      calculateFirstTravelOrders(res.entries);
      if (res.entries.length) $scope.noResults = false;
      else $scope.noResults = true;

      setupFreeSearch();
      setupTravelSearch();

    });
  } else {

    setupFreeSearch();
    setupTravelSearch();

  }

  //  support for free search by section
  function setupFreeSearch() {

    if ($scope.query.entry) {
      for (var k in $scope.freeSearchSections) {
        if ($scope.query.entry.sections[k]) $scope.freeSearchQuery = $scope.query.entry.sections[k];
        else $scope.freeSearchSections[k] = false;
      }
      if ($scope.query.entry.beginnings === 'no') $scope.freeSearchBeginnings = false;
    }

    //  support for free search by section
    $scope.$watch('freeSearchQuery', function(freeSearchQuery) {
      for (var section in $scope.freeSearchSections) {
        if ($scope.freeSearchSections[section] && freeSearchQuery) {
          if (!$scope.query.entry) $scope.query.entry = { sections: {} };
          $scope.query.entry.sections[section] = freeSearchQuery;
        }
      }
      if ($scope.query.entry) $scope.query.entry.beginnings = $scope.freeSearchBeginnings ? 'yes' : 'no';
    });

    $scope.$watchCollection('freeSearchSections', function(freeSearchSections) {
      for (var section in freeSearchSections) {
        if (freeSearchSections[section] && $scope.freeSearchQuery) {
          if (!$scope.query.entry) $scope.query.entry = { sections: {} };
          $scope.query.entry.sections[section] = $scope.freeSearchQuery;
        }
        else if ($scope.query.entry) {
          delete $scope.query.entry.sections[section];
          if (Object.keys($scope.query.entry.sections).length === 0) delete $scope.query.entry;
        }
      }
      if ($scope.query.entry) $scope.query.entry.beginnings = $scope.freeSearchBeginnings ? 'yes' : 'no';
    });

    $scope.$watch('freeSearchBeginnings', function(freeSearchBeginnings) {
      if ($scope.query.entry) $scope.query.entry.beginnings = freeSearchBeginnings ? 'yes' : 'no';
    });

  }

  //  support for travel date range search
  function setupTravelSearch() {

    if ($scope.query.travel) {
      if ($scope.query.travel.date) {
        if ($scope.query.travel.date.startYear !== $scope.query.travel.date.endYear ||
            $scope.query.travel.date.startMonth !== $scope.query.travel.date.endMonth ||
            $scope.query.travel.date.startDay !== $scope.query.travel.date.endDay) {
          travelModel.date.queryType = 'range';
        }
        travelModel.date.query = $scope.query.travel.date;
      }
      if ($scope.query.travel.place) {
        travelModel.place = $scope.query.travel.place;
      }

    }

    $scope.$watch('travelModel', function(travelModel) {
      if (travelModel.date.queryType === 'exact') {
        travelModel.date.query.endYear = travelModel.date.query.startYear;
        travelModel.date.query.endMonth = travelModel.date.query.startMonth;
        travelModel.date.query.endDay = travelModel.date.query.startDay;
      }
      for (key in travelModel.date.query) if (!travelModel.date.query[key]) delete travelModel.date.query[key];
      if (Object.getOwnPropertyNames(travelModel.date.query).length > 0) {
        $scope.query.travel = $scope.query.travel || { date: {} };
        $scope.query.travel.date = travelModel.date.query;
      } else if ($scope.query.travel) delete $scope.query.travel.date;
      if (travelModel.place) {
        $scope.query.travel = $scope.query.travel || {};
        $scope.query.travel.place = travelModel.place;
      } else if ($scope.query.travel) delete $scope.query.travel.place;
      if ($scope.query.travel && !$scope.query.travel.place && !$scope.query.travel.date) delete $scope.query.travel;
    }, true);

  };

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

  //  initialize view model
  var viewModel = {
      newListName: ''
  };

  //  expose view model to scope
  $scope.viewModel = viewModel;

  //  expose shared list model to scope
  $scope.sharedListModel = listService.sharedListModel

  //  selection/delection commands
  $scope.selectAllEntries = function() {
    for (var i = 0; i < $scope.entries.length; i++) {
      $scope.entries[i].selected = true;
    }
  };

  $scope.deselectAllEntries = function() {
    for (var i = 0; i < $scope.entries.length; i++) {
      $scope.entries[i].selected = false;
    }
  };

  $scope.addSelectedEntriesToList = function(list) {
    for(var i = 0; i < $scope.entries.length; i++) {
      var entry = $scope.entries[i];
      if (entry.selected) {
        entry.addedToList = entry.alreadyInList = false;
        listService.addToList(list, entry, (function(result) {
          if (result.addedToList) {
            this.entry.addedToList = true;
          } else if (result.alreadyInList) {
            this.entry.alreadyInList = true;
          }
        }).bind({ entry: entry }));
      }
    }
  };

  $scope.addSelectedEntriesToNewList = function() {
    listService.newList(viewModel.newListName, function(list) {
      viewModel.newListName = '';
      console.log('list created: ' + list.name);
      $scope.addSelectedEntriesToList(list);
    });
  };

  //  support for sorting entries
  var sortModel = {
    activeSortableDimensions: [
      { label : 'Fullname', sorting : 'fullName' },
      { label : 'Birth date', sorting : 'dates[0].birthDate' },
      { label : 'Birth place', sorting : 'places[0].birthPlace' },
      { label : 'Date of first travel', sorting : 'firstTravelUTC' },
    ],
    dimension: 'index',
    reverseSorting: false
  };

  $scope.sortModel = sortModel;

  function calculateFirstTravelOrders(entries) {
    for (var i = 0; i < entries.length; i++) {

      var entry = entries[i];
      if (entry.travels) {

        for (var j = 0; j < entry.travels.length; j++) {

          var travel = entry.travels[j];
          if (travel.travelStartYear) {

            entry.firstTravelUTC = Date.UTC(travel.travelStartYear, travel.travelStartMonth, travel.travelStartDay);
            break;

          }
        }
      }
    }
  }

  //  export function copied from explore.js
  $scope.export = function(field, value){

    var $btn = $('#export-button').button('loading')

    $http.post('/api/entries/export/', {  query: $scope.query } )
      .success(function (res){

        var entries = d3.tsv.format(res.result.entries);
        var activities = d3.tsv.format(res.result.activities);
        var travels = d3.tsv.format(res.result.travels);

        var zip = new JSZip();
        zip.file("Entries.tsv", entries);
        zip.file("Activities.tsv", activities);
        zip.file("Travels.tsv", travels);
        var content = zip.generate({type:"blob"});
        saveAs(content, "Grand Tour Explorer - Export.zip");
        $btn.button('reset')

      })



  }

  //  download counts
  $http.get('/api/getcount')
  .then(function(res) {
    if (res.data.error) console.error(res.data.error);
    else $scope.counts = res.data.counts;
  });


  //  helper functions for displaying complex queries in pills
  $scope.$watch('query', function(query) {
    $scope.pills = [];

    for (key in query) {
      if (query.hasOwnProperty(key)) {

        var pill = {};
        switch (key) {

          case 'entry':
            pill.dimension = 'free search in ' + Object.keys($scope.query.entry.sections).join(', ');
            if ($scope.query.entry.beginnings === 'yes') pill.dimension += ' (word beginnings only)'
            pill.value = $scope.query.entry.sections[Object.keys($scope.query.entry.sections)[0]];
            break;

          case 'travel':
            pill.dimension = 'travel ';
            pill.value = '';

            if (query.travel.place) {

              if (query.travel.date) {
                pill.dimension += 'place and ';
                pill.value += (query.travel.place + ', ');
              } else {
                pill.dimension += 'place';
                pill.value += query.travel.place;
              }

            }

            if (query.travel.date) {

              pill.dimension += 'date'

              if ($scope.travelModel.date.queryType === 'range') {
                pill.dimension += ' range';
                if (query.travel.date.startYear) pill.value += 'from '
              }

              if (query.travel.date.startYear) pill.value += query.travel.date.startYear;
              if (query.travel.date.startMonth) pill.value += '/' + query.travel.date.startMonth;
              if (query.travel.date.startDay)  pill.value += '/' + query.travel.date.startDay;

              if ($scope.travelModel.date.queryType === 'range') {
                if (query.travel.date.endYear) pill.value += ' until ' + query.travel.date.endYear;
                if (query.travel.date.endMonth) pill.value += '/' + query.travel.date.endMonth;
                if (query.travel.date.endDay) pill.value += '/' + query.travel.date.endDay;
              }

            }

            break;

          default:
            pill.dimension = key.split('_').join(' ');
            pill.value = query[key];

        }
        $scope.pills.push(pill);

      }
    }

  }, true);

});

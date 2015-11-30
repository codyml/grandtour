/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('EntryCtrl', function($scope, $http, $stateParams, $sce, $timeout, $location, listService) {

  if($stateParams.id) {
    // save
    $scope.id = parseInt($stateParams.id);
    $http.get('/api/entries/' + $stateParams.id )
    .success(function (res){
      $scope.entry = res.entry;
      if (!res.entry) $scope.noEntry = true;
      else $scope.noEntry = false;

      createTours(res.entry.travels);
      createOccupations(res.entry.occupations);
      createMilitary(res.entry.military);

      $timeout(smartquotes);
      $timeout(function(){ $('[data-toggle="tooltip"]').tooltip(); })
    })
  }

  function createTours(travels){
    if (!travels) return;
    var nest = d3.nest()
    .key(function(d) { return d.tourIndex; })
    .entries(travels);

    nest.forEach(function(d){
      d.start = d.values[0].tourStartFrom;
      d.end = d.values[0].tourEndFrom;
    })

    $scope.tours = nest;
  }

  function createMilitary(military){
    $scope.military = military ? military.filter(function(d){ return d.rank; }) : [];
  }

  function createOccupations(occupations){
    if (!occupations) return;
    var nest = d3.nest()
    .key(function(d) { return d.group; })
    .entries(occupations);
    $scope.occupations = nest;
  }

  function createNotes(notes){
    return notes.split(/\.\s[0-9]{1,2}\.\s/gi);
  }

  $scope.superscript = function(text, n){
    if (!text) return;
    var notes =  n ? createNotes(n) : [];
    function replacer(match, p1, p2, p3, offset, string) {
      var t = p2 == 1? notes[p2-1] : p2 + ". " +  notes[p2-1];
      return p1 + "<sup class=\"text-primary\" data-toggle=\"popover\" data-content=\"" + t + "\">[" + p2 + "]</sup>";
    }

    return $sce.trustAsHtml(text.replace(/(\.|\,|'|;|[a-z]|[0-9]{4})([0-9]{1,2})(?=\s|$|\n|\r)/gi, replacer));
  }

  $scope.search = function(query){
    $location.path('search/' + JSON.stringify(query) );
  }

  $scope.searchTravel = function(travel) {
    var query = { travel_place: travel.place, travel_date: {} };
    if (travel.travelStartYear) query.travel_date.startYear = travel.travelStartYear;
    if (travel.travelStartMonth) query.travel_date.startMonth = travel.travelStartMonth;
    if (travel.travelStartDay) query.travel_date.startDay = travel.travelStartDay;
    if (travel.travelEndYear) query.travel_date.endYear = travel.travelEndYear;
    if (travel.travelEndMonth) query.travel_date.endMonth = travel.travelEndMonth;
    if (travel.travelEndDay) query.travel_date.endDay = travel.travelEndDay;
    $location.path('search/' + JSON.stringify(query));
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

  $scope.$watch( function(){ return $('.check-html').html(); }, function(html){
    $(function () {
      $('[data-toggle="popover"]').popover({trigger:'hover', placement:'top', container:'body'});
    })
  })

  //$(window).load(smartquotes);

  //  initialize view model
  var viewModel = {
      newListName: ''
  };

  //  expose view model to scope
  $scope.viewModel = viewModel;

  //  expose shared list model to scope
  $scope.sharedListModel = listService.sharedListModel;

  $scope.addSelectedEntriesToList = function(list) {
    var entry = $scope.entry;
    entry.addedToList = entry.alreadyInList = false;
    listService.addToList(list, entry, function(result) {
      if (result.addedToList) {
        entry.addedToList = true;
      }
      if (result.alreadyInList) entry.alreadyInList = true;
    });
  };

  $scope.addSelectedEntriesToNewList = function() {
    listService.newList(viewModel.newListName, function(list) {
      viewModel.newListName = '';
      console.log('list created: ' + list.name);
      $scope.addSelectedEntriesToList(list);
    });
  };



})

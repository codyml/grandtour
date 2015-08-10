/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('SearchCtrl', function($scope, $http, $location, $stateParams) {

  $scope.query = {};

  if($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    $scope.searching = true;
    $http.post('/api/entries/search', {
        query: $scope.query
      }
    )
    .success(function(res){
      $scope.searching = false;
      $scope.entries = res.entries;
      if (res.entries.length) $scope.noResults = false;
      else $scope.noResults = true;
    });

  }

  $scope.search = function(){
    $location.path('search/' + JSON.stringify($scope.query) );
  }

  $scope.$watch(function(){ return JSON.stringify($scope.query);}, function(){
    if ($scope.query == {}) return;
    $scope.pills = [];

    for (var k in $scope.query){
      console.log(k,seek($scope.query[k], $scope.query))
      $scope.pills.push(seek($scope.query[k], $scope.query))
    }
    //$scope.$apply();
  }, true);


  function seek(obj, pre) {
    for (var k in obj){
      if (typeof obj[k] != 'object' ) {
        console.log(obj,k,pre,Object.getOwnPropertyNames(pre)[0])
        var o = {};
        o[Object.getOwnPropertyNames(pre)[0]] = obj[k]
        return o;
      } else return seek(obj[k], obj);
    }
  }



  $scope.getSuggestions = function(field, value){
    return $http.post('/api/entries/suggest/', {  field : field, value : value })
    .then(function (res){
      console.log(res)
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

  $('.tooltip').remove();

});

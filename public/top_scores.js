var app = angular.module('app', []);

app.controller('controller', function($scope, $http) {
  $scope.formData = {};
  $scope.data = [];

  // Get all todos
  $http.get('/top10').success(function(data) {
    for (key in data) {
      $scope.data.push(data[key]);
    }
    console.log($scope.data);
  })
  .error(function(error) {
    console.log('Error: ' + error);
  });
});

app.controller('controllerToday', function($scope, $http) {
  $scope.formData = {};
  $scope.data = [];

  // Get all todos
  $http.get('/top10Today').success(function(dataToday) {
    console.log(dataToday);
    for (key in dataToday) {
      $scope.data.push(dataToday[key]);
    }
    console.log("today");
    console.log($scope.data);
  })
  .error(function(error) {
    console.log('Error: ' + error);
  });
});

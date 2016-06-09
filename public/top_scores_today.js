console.log('ANGULAR JS FILE');

var appToday = angular.module('appToday', []);

appToday.controller('controllerToday', function($scope, $http) {
    $scope.formData = {};
    $scope.data = [];

    // Get all todos
    $http.get('/top10Today')
        .success(function(dataToday) {
            console.log(dataToday);
            for (key in dataToday) {
              $scope.data.push(dataToday[key]);
              console.log($scope.data);
            }
        })
        .error(function(error) {
            console.log('Error: ' + error);
        });

});

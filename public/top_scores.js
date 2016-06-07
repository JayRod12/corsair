console.log('ANGULAR JS FILE');

var app = angular.module('app', []);

app.controller('controller', function($scope, $http) {
    $scope.formData = {};
    $scope.data = [];

    // Get all todos
    $http.get('/top10')
        .success(function(data) {
            console.log(data);
            for (key in data) {
              $scope.data.push(data[key]);
              console.log($scope.data);
            }
        })
        .error(function(error) {
            console.log('Error: ' + error);
        });
});

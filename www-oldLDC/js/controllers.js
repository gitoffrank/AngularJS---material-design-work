angular.module('starter.controllers', [])
.controller('CommentCtrl', function($scope, $state, $stateParams, $ionicPopup, $timeout, Visitors)  {
	$scope.visitors = [];
    
 	moment.locale('en', {
	relativeTime: {
	  future: "in %s",
	  past: "%s ago",
	  s: "%d sec",
	  m: "a minute",
	  mm: "%d minutes",
	  h: "an hour",
	  hh: "%d hours",
	  d: "a day",
	  dd: "%d days",
	  M: "a month",
	  MM: "%d months",
	  y: "a year",
	  yy: "%d years"
	}
	});

    $scope.visitors = Visitors.all();
    $scope.newComment = function() {
    	//new comment without selecting visitor first
    	$state.go('tab.visitor-comment');
    }
})
.controller('VisitorCommentCtrl', function($scope, $state, $stateParams, $ionicPopup, $timeout, Visitors, OpenHouse)  {
	$scope.visitor = {};
	$scope.visitor.id = '';
	$scope.visitor.firstname = '';
	$scope.visitor.lastname = '';
    $scope.visitor.comment = '';
    $scope.visitors = Visitors.all();	
    	
	if ( $stateParams.id == "" ) {
		$scope.visitor.id = 'unknown';
		$scope.visitor.firstname = 'unknown';
		$scope.visitor.lastname = 'visitor';
	}
	else {
		$scope.visitor.id = $stateParams.id;
		for(var i=0; i<$scope.visitors.length;i++) {
			if ( $scope.visitors[i].id == $scope.visitor.id ) {
				$scope.visitor.firstname = $scope.visitors[i].firstname;
				$scope.visitor.lastname = $scope.visitors[i].lastname;
				break;
			}
		}
	}
    
    $scope.submitNewComment = function(id) {
    	var visitor = angular.fromJson(angular.toJson($scope.visitor));
		var open = OpenHouse.open();
    	visitor.mls = open.mls;
    	visitor.address = open.address;
    	visitor.property = open.property;

    	var promise = Visitors.comment(visitor);

    	$scope.visitor.comment = '';
    	
    	var alertPopup = $ionicPopup.alert({
        	title: 'Comment Submitted',
        	template: 'Thank You'
		});
		$timeout(function(){alertPopup.close()}, 2000);
		
		$state.go('tab.comment');
    }
    
})
.controller('VisitorCtrl', function($scope, $state, $stateParams, $ionicPopup, $timeout, OpenHouse, Visitors) {
    $scope.data = {};
    $scope.data.id = '';
    $scope.data.date = '';
    $scope.data.firstname = '';
    $scope.data.lastname = '';
    $scope.data.email = '';
    $scope.data.phone = '';
    $scope.data.questions = [];
    $scope.visitors = Visitors.all();
    $scope.open = OpenHouse.open();
	for (var i=0;i<$scope.open.questions.length;i++) $scope.data.questions[i] = {"question":$scope.open.questions[i].text,"answer":""};

	$scope.$on('$ionicView.enter', function() {
    	$scope.visitors = Visitors.all();
    	$scope.open = OpenHouse.open();
		for (var i=0;i<$scope.open.questions.length;i++) $scope.data.questions[i] = {"question":$scope.open.questions[i].text,"answer":""};
	});
   	
    $scope.submitNewVisitor = function() {
    	var OK2Submit = true;
		for (var i=0; i<$scope.data.questions.length; i++) {
			if ( $scope.data.questions[i].answer == '' && $scope.open.questions[i].required ) OK2Submit = false;
		}
    	if ( !OK2Submit || $scope.data.firstname == '' || $scope.data.lastname == '' || ($scope.data.email == '' && $scope.data.phone == '')) {
			var alertPopup = $ionicPopup.alert({
				title: 'Complete Form',
				template: 'Please fill in the requested information.'
			});
			$timeout(function(){alertPopup.close()}, 6000);
			return;
    	}    	
    	//generate an id
    	$scope.data.date = new Date;
    	$scope.data.id = UUID.new();
    	// attach openHouse data to the visitor record
    	$scope.data.mls = $scope.open.mls;
    	$scope.data.address = $scope.open.address;
    	$scope.data.property = $scope.open.property;
    	
    	var visitor = angular.fromJson(angular.toJson($scope.data));
    	var promise = Visitors.add(visitor);
		
		$scope.data.id = '';
		$scope.data.firstname = '';
		$scope.data.lastname = '';
		$scope.data.email = '';
		$scope.data.phone = '';
		for (var i=0;i<$scope.open.questions.length;i++) $scope.data.questions[i].answer = "";
		
    	var alertPopup = $ionicPopup.alert({
        	title: 'Information Submitted',
        	template: 'Thank You'
		});
		$timeout(function(){alertPopup.close()}, 2000);
    }
})
.controller('AccountCtrl', function($scope, $state, $http, $rootScope, $ionicPopup, OpenHouse, AuthService, USER_ROLES, Account) {
	$scope.username = AuthService.username();
	$scope.open = OpenHouse.open();
	$scope.open.validate = '';
	$scope.showNew = false;
	$scope.isOpen = OpenHouse.isOpen();
	$scope.properties = [];
	$scope.newQuestion = {};
	$scope.newQuestion.text = '';

	$scope.goToDesktop = function() {
		//'https://www.liondesk.com/admin/index.html'
		var url = 'https://www.liondesk.com/admin/login_key.html?idToken='+AuthService.authToken;
		if ( window.cordova ) {
			var ref = cordova.InAppBrowser.open(url,'_blank','location=no');
		}
		else {
			var ref= window.open(url,'_blank','location=no');
		}
	}
	
	$scope.logout = function() {
		if ( $scope.isOpen ) {
			$ionicPopup.alert({
			  title: 'Open House',
			  template: 'You must close the Open House before logging out.'
			});
    	}
    	else {
			AuthService.logout();
			$state.go('login');
    	}
	};
 
 	$scope.addQuestion = function() {
 		OpenHouse.addQuestion(angular.copy($scope.newQuestion));
 		$scope.open = OpenHouse.open();
 		$scope.newQuestion.text = '';
 		$scope.newQuestion.required = false;
 	}
 	$scope.deleteQuestion = function(idx) {
 		OpenHouse.deleteQuestion(idx);
 		$scope.open = OpenHouse.open();
 	}
 	
 	$scope.showOpenHouse = function() {
 		var promise = Account.properties();
 		promise.then(
  			function(data) {
 				$scope.showNew = true;
 				$scope.properties = data;
  			}
  		);
 	}
 	
 	$scope.newOpenHouse = function() {
 		if ( ($scope.open.address == '' && $scope.open.mls == '' && $scope.open.property == '') || $scope.open.pass == ''  || ($scope.open.pass != $scope.open.validate) ) {
 			var alertPopup = $ionicPopup.alert({
        		title: 'Form Validation',
				template: 'Please enter all the required data'
			});
			return;
 		}
 		else {
 			OpenHouse.set({id: UUID.new(),address:$scope.open.address,mls:$scope.open.mls,property:$scope.open.property,pass:$scope.open.pass});
 			$scope.showNew = false;
 			$scope.isOpen = true;
 		}
 	}
 	
 	$scope.closeOpenHouse = function() {
		OpenHouse.set({});
		$scope.isOpen = false;
		$scope.open.id = '';
		$scope.open.address = '';
		$scope.open.mls = '';
		$scope.open.property = '';
		$scope.open.pass = '';
		$scope.open.validate = '';
 	}
 	
 	/*
	$scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
		if (toState.name == "tab.account" ) {
			event.preventDefault();
			$state.reload();
		}
	});
	*/
	
	$scope.$on('$ionicView.enter', function() {
		if ( $scope.isOpen ) {
			$ionicPopup.prompt({
				  title: 'Password Check',
				  subTitle: 'Enter this Open House password',
				  inputType: 'password',
				  inputPlaceholder: 'Password'
			}).then(function(res) {
				  if ( res && (res == $scope.open.pass || res.toLowerCase() == AuthService.username().toLowerCase()) ) {
					//OK to switch
				  }
				  else {
						if ( res ) {
						  $ionicPopup.alert({
							title: 'Password',
							template: 'Incorrect Password.'
						  });
						}
						//prevent entry
						$state.go('tab.comment');
				  }
			});
    	}
	});

})

.controller('LoginCtrl', function($scope, $state, $ionicPopup, AuthService) {
  $scope.data = {};
 
  $scope.login = function(data) {
    AuthService.login(data.username, data.password).then(function(authenticated) {
      $state.go('tab.account');
      $scope.setCurrentUsername(data.username);
    }, function(err) {
      var alertPopup = $ionicPopup.alert({
        title: 'Login failed!',
        template: 'Please check your credentials!'
      });
    });
  };
})
.controller('AppCtrl', function($scope, $state, $ionicPopup, AuthService, AUTH_EVENTS) {
  $scope.username = AuthService.username();
 
  $scope.$on(AUTH_EVENTS.notAuthorized, function(event) {
    var alertPopup = $ionicPopup.alert({
      title: 'Unauthorized!',
      template: 'You are not allowed to access this resource.'
    });
  });
 
  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    AuthService.logout();
    $state.go('login');
    var alertPopup = $ionicPopup.alert({
      title: 'Session Lost!',
      template: 'Sorry, You have to login again.'
    });
  });
 
  $scope.setCurrentUsername = function(name) {
    $scope.username = name;
  };
});

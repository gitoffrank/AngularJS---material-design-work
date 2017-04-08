// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic','ionic.service.core','ngIOS9UIWebViewPatch','ionic.service.push','ngCordova', 'starter.controllers', 'starter.services','angularMoment'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.disableScroll(true);
      //cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})
.config(function($ionicAppProvider) {
	// Identify app
	$ionicAppProvider.identify({
		// The App ID (from apps.ionic.io) for the server
		app_id: '1fa61e1a',
		// The public API key all services will use for this app
		api_key: '65008bb1eb775e637406c6fa5f72ad4b7d7511b038f19ea3',
		// If true, will attempt to send development pushes
		dev_push: false
	});
})
.config(function($stateProvider, $urlRouterProvider, USER_ROLES) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
$stateProvider
 .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })
  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })
  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    },
    data: {
      authorizedRoles: [USER_ROLES.admin,USER_ROLES.user]
    }
  })
  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'VisitorCtrl'
      }
    },
    data: {
      authorizedRoles: [USER_ROLES.admin,USER_ROLES.user],
      openHouse: true
    }
  })
  .state('tab.comment', {
	  url: '/comment',
	  views: {
		'tab-comment': {
		  templateUrl: 'templates/tab-comment.html',
		  controller: 'CommentCtrl'
		}
	  },
	  data: {
		authorizedRoles: [USER_ROLES.admin,USER_ROLES.user],
		openHouse: true
	  }
  })
  .state('tab.visitor-comment', {
	  url: '/visitor-comment/:id',
	  views: {
		  'tab-comment': {
			  templateUrl: 'templates/tab-comment-visitor.html',
			  controller: 'VisitorCommentCtrl'
		  }
	  },
	  data: {
		  authorizedRoles: [USER_ROLES.admin,USER_ROLES.user],
		  openHouse: true
	  }
  })
  ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/dash');
  
})
.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})
.constant('USER_ROLES', {
  admin: 'admin_role',
  user: 'user_role'
})
.run(function ($rootScope, $state, $ionicPopup, OpenHouse, AuthService, AUTH_EVENTS) {
	//debug
	$rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams){
	  console.log('$stateChangeStart to '+toState.to+'- fired when the transition begins. toState,toParams : \n',toState, toParams, fromState, fromParams);
	});
	$rootScope.$on('$stateChangeError',function(event, toState, toParams, fromState, fromParams, error){
	  console.log('$stateChangeError - fired when an error occurs during transition.');
	  console.log(arguments);
	});
	$rootScope.$on('$stateChangeSuccess',function(event, toState, toParams, fromState, fromParams){
	  console.log('$stateChangeSuccess to '+toState.name+'- fired once the state transition is complete.');
	});
	$rootScope.$on('$viewContentLoaded',function(event){
	  console.log('$viewContentLoaded - fired after dom rendered',event);
	});
	$rootScope.$on('$stateNotFound',function(event, unfoundState, fromState, fromParams){
	  console.log('$stateNotFound '+unfoundState.to+'  - fired when a state cannot be found by its name.');
	  console.log(unfoundState, fromState, fromParams);
	});
	//end debug

	$rootScope.$on('$stateChangeStart', function (event,next, nextParams, fromState) {
 
		if ('data' in next && 'authorizedRoles' in next.data) {
		  var authorizedRoles = next.data.authorizedRoles;
		  if (!AuthService.isAuthorized(authorizedRoles)) {
			event.preventDefault();
			//$state.go('login', {}, {notify:false,reload:false});
			$state.go('login');
			//$rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
		  }
		}
 
		if (!AuthService.isAuthenticated()) {
		  if (next.name !== 'login') {
			event.preventDefault();
			$state.go('login');
		  }
		}

	});
  
      
  $rootScope.$on('$stateChangeSuccess', function (event,next, nextParams, fromState) {
    	// see if we need an open house for this page

		if ( 'data' in next && 'openHouse' in next.data ) {
			if (next.data.openHouse && !OpenHouse.isOpen()) {
				event.preventDefault();
				$state.go('tab.account');
				var alertPopup = $ionicPopup.alert({
					title: 'Open House',
					template: 'Please start an Open House first.'
				});
			}
		}
		
  });
    

})
;


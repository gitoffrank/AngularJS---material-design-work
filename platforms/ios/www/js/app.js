// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic','ionic.service.core','ionic.service.push','starter.controllers', 'starter.services','ngIOS9UIWebViewPatch','angularMoment'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      //cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if ( window.cordova && window.cordova.plugins.notification.badge ) {
    	//cordova.plugins.notification.badge.set(10);
    	//cordova.plugins.notification.badge.clear();
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})
.config(function($stateProvider, $urlRouterProvider) {
  /*
  $ionicAppProvider.identify({
	  // The App ID (from apps.ionic.io) for the server
	  app_id: '1fa61e1a',
	  // The public API key all services will use for this app
	  api_key: '65008bb1eb775e637406c6fa5f72ad4b7d7511b038f19ea3',
	  // If true, will attempt to send development pushes
	  dev_push: false
  });
  */
 
  $stateProvider
 .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })
  .state('app.welcome', {
      url: '/welcome',
      views: {
        'menuContent': {
          templateUrl: 'templates/welcome.html',
          controller: 'WelcomeCtrl'
        }
      }
  })
  .state('app.alerts', {
  	url: '/alerts?:goTo',
  	views: {
  		'menuContent': {
  			templateUrl: 'templates/alerts.html',
  			controller: 'AlertCtrl'
  		}
  	}
  })
  .state('app.contacts', {
    url: '/contacts',
    views: {
      'menuContent': {
        templateUrl: 'templates/contacts.html',
        controller: 'ContactCtrl'
      }
    }
  })
  .state('app.contact', {
    url: '/contacts/:id',
    views: {
      'menuContent': {
        templateUrl: 'templates/contact.html',
        controller: 'ContactCtrl'
      }
    }
  })
  .state('app.contactNew', {
    url: '/contacts/new',
    views: {
      'menuContent': {
        templateUrl: 'templates/contactNew.html',
        controller: 'ContactCtrl'
      }
    }
  })
  .state('app.contactEdit', {
	url: '/contacts/:id/edit',
	views: {
		'menuContent': {
			templateUrl: 'templates/contactEdit.html',
			controller: 'ContactCtrl'
		}
	}
  })
 .state('app.tasks', {
      url: '/tasks',
      views: {
        'menuContent': {
          templateUrl: 'templates/tasks.html',
          controller: 'TaskCtrl'
        }
      }
  })
  .state('app.taskNew', {
    url: '/tasks/new/:id',
    views: {
      'menuContent': {
        templateUrl: 'templates/taskNew.html',
        controller: 'TaskCtrl'
      }
    }
  })
  .state('app.taskEdit', {
	url: '/tasks/:id/edit',
	views: {
		'menuContent': {
			templateUrl: 'templates/taskEdit.html',
			controller: 'TaskCtrl'
		}
	}
  })
  .state('app.text', {
	url: '/text',
	views: {
		'menuContent': {
			templateUrl: 'templates/text.html',
			controller: 'TextCtrl'
		}
	}
  })
  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'AppCtrl'
  })
  .state('tab.openhouse', {
	url: '/openhouse',
    views: {
    	'tab-openhouse': {
			templateUrl: 'templates/tab-openhouse.html',
			controller: 'OpenHouseCtrl'
		}
	}
  })
  .state('tab.visitor', {
	url: '/visitor',
    views: {
    	'tab-visitor': {
			templateUrl: 'templates/tab-visitor.html',
			controller: 'VisitorCtrl'
		}
	}
  })
  .state('tab.comment', {
	url: '/comment',
    views: {
    	'tab-comment': {
			templateUrl: 'templates/tab-comment.html',
			controller: 'CommentCtrl'
		}
	}
  })
  .state('tab.visitor-comment', {
	  url: '/visitor-comment/:id',
	  views: {
		  'tab-comment': {
			  templateUrl: 'templates/tab-comment-visitor.html',
			  controller: 'VisitorCommentCtrl'
		  }
	  }
  })
  ;
  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/welcome');
})
/*
.run(function($rootScope) {

	$rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams){
	  console.log('$stateChangeStart to '+toState.to+'- fired when the transition begins. toState,toParams : \n',toState, toParams);
	});

	$rootScope.$on('$stateChangeError',function(event, toState, toParams, fromState, fromParams){
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
})
*/
;

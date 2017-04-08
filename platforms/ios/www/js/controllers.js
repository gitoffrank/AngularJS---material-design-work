angular.module('starter.controllers', ['ngMdIcons','ngMaterial'])

.controller('AppCtrl', function($scope, $state, $ionicModal, $timeout, LionDesk, $ionicSideMenuDelegate) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
 this.infiniteItems = {
          numLoaded_: 0,
          toLoad_: 0,
          // Required.
          getItemAtIndex: function(index) {
            if (index > this.numLoaded_) {
              this.fetchMoreItems_(index);
              return null;
            }
            return index;
          },
          // Required.
          // For infinite scroll behavior, we always return a slightly higher
          // number than the previously loaded items.
          getLength: function() {
            return this.numLoaded_ + 5;
          },
          fetchMoreItems_: function(index) {
            // For demo purposes, we simulate loading more items with a timed
            // promise. In real code, this function would likely contain an
            // $http request.
            if (this.toLoad_ < index) {
              this.toLoad_ += 20;
              $timeout(angular.noop, 300).then(angular.bind(this, function() {
                this.numLoaded_ = this.toLoad_;
              }));
            }
          }
        };

  $scope.badge = {alerts: ''};
  
  // Form data for the login modal
  $scope.loginData = {username:"",password:"",token:""};
  $scope.loginData.token = LionDesk.getToken();
  
  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    LionDesk.login($scope.loginData.username, $scope.loginData.password).then(function(token) {
      $scope.loginData.token = token;
      $scope.modal.hide();
    }, function(err) {
      alert('Unable to log in');
    });
  };

  $scope.logout = function() {
    //LionDesk.logout();
    $scope.loginData = {username:"",password:"",token:""};
    $state.go('app.welcome');
    $ionicSideMenuDelegate.toggleLeft();
    
  }

  $scope.goTo = function(url) {
	  if ( window.cordova ) {
		  var ref = cordova.InAppBrowser.open(url,'_system','location=no');//_system,_blank,_
	  }
	  else {
		  var ref= window.open(url, "_blank", "location=no");
	  }
  }
  
  LionDesk.getUserInfo()
  .then(function(id) {
	  LionDesk.getFirebase().child("users/"+id+"/alerts").on("value", function(snapshot) {
		  var val = snapshot.val();
		  if ( val == 0) val = '';
		  $scope.badge.alerts = val;
		  if ( window.cordova && window.cordova.plugins.notification.badge ) {
			cordova.plugins.notification.badge.set(val);
			if ( val == '' ) cordova.plugins.notification.badge.clear();
		  }
		  $scope.$apply();
	  });
  }, function(err) {
  	alert(err);
  });
  
})
.controller('WelcomeCtrl', function($scope,  $mdToast, $state, $ionicModal, $timeout, LionDesk) {

if (!$scope.loginData.token){
		var toast = $mdToast.simple()
	    .content("Please login from the menu!")
	    .highlightAction(true)
	    .hideDelay(5000)
	    .position('top right');
	    $mdToast.show(toast);

		$scope.login = function() {
    		$scope.modal.show();
  		};
	  
}else{
	 var toast = $mdToast.simple()
	    .content("Please select an option from the menu!")
	    .highlightAction(true)
	    .hideDelay(5000)
	    .position('top right');
	    $mdToast.show(toast);

	   $scope.first= function(){
	   	 $state.go("app.alerts");
	   }
	   $scope.second= function(){
	   	$state.go("app.contacts");
	   }
	   $scope.third= function(){
	   	 $state.go("app.tasks");
	   }
	   $scope.fourth= function(){
	   	$state.go("app.text");
	   }
	   $scope.fifth= function(){
	   	 $state.go("tab.openhouse");
	   }
	   $scope.sixth= function(){
	   	$state.go("app.contacts");
	   }
	}
})

.controller('TextCtrl', function($scope, $ionicScrollDelegate, LionDesk) {
	$scope.texts = [];
	$scope.text = {id:0,message:"",room:""};
	
	$scope.submit = function() {
		LionDesk.sendText($scope.text)
		.then(function(){
			//done.
		},
		function(error){
			alert(error);
		});
	}

	var fbref = LionDesk.getFirebase();
  	var viewScroll = $ionicScrollDelegate.$getByHandle('messageScroll');
	$scope.$on('$ionicView.enter', function(event, state){
	
		//hard code the message room between john and dave - list of user ids dash delimited in ascending order
		$scope.text.room = "12-42";
	
		fbref.child('text-messaging/'+$scope.text.room+'/messages').on("child_added", function(snapshot, prevChildKey) {
		  var newPost = snapshot.val();
		  $scope.texts.push(newPost);
		  console.log(newPost);
		  viewScroll.scrollBottom();
		});
	
	});
	$scope.$on('$destroy', function() {
		fbref.child('text-messaging/'+$scope.text.room+'/messages').off("child_added");
	});   

})
.controller('AlertCtrl', function($scope, $rootScope, LionDesk) {
	$scope.alerts = [];
	
	$scope.getAlerts = function() {
		LionDesk.getMessages()
		.then(function(messages){
			for (var i=0;i<messages.length;i++) {
				messages[i].message = messages[i].message.replace(/<a.*?href\s*=\s*[\"']([^\"']*)[\"'][^>]*>/ig,"<a href=\"#\" ng-click=\"goTo('$1')\">");
				var payload = {};
				if (messages[i].payload != "") payload = angular.fromJson(messages[i].payload);
				messages[i].payload = payload;
			}
			$scope.alerts = messages;
		},
		function(error){
		  alert(error);
		});
	}
	
	$scope.confirmAlert = function(alert, index) {
		var data = {id:alert.id,status:0,type:"status"};
		LionDesk.setMessage(data)
		.then(function(updated) {
			if ( updated > 0 ) $scope.alerts.splice(index, 1);
		}, function(error) {
			alert(error);
		});
	}
	
	$scope.newAlert = function() {
		var data = {toUser:LionDesk.userInfo().userid,message:"How are you?",type:"add"};
		LionDesk.setMessage(data);
	}
	
	$scope.doPayload = function(payload) {
		if (angular.isDefined(payload.goTo) && payload.goTo != "") $scope.goTo(payload.goTo);
	}

	$scope.$on('alerts-load', function(event, args) {
		$scope.getAlerts();
		$scope.doPayload(args);
	});

	$scope.$on('$ionicView.enter', function(event, state){
		$scope.getAlerts();
	  	$scope.doPayload(state.stateParams);
	});
})
.controller('ContactCtrl', function($scope, $state, $location, $ionicLoading, LionDesk) {
	$scope.search = {"keyword":"", "active":false};
	$scope.contact = {};
	$scope.contacts = [];

	$scope.find = function() {
		$ionicLoading.show({template: 'Please Wait...'});
		LionDesk.getContacts($scope.search.keyword)
		.then(function(contacts){
		  $scope.contacts = contacts;
		  $ionicLoading.hide();
		  $scope.search.active = true;
		},
		function(error){
		  $ionicLoading.hide();
		  alert(error);
		});
	};

	$scope.loadMore = function() {
		LionDesk.getContacts()
		.then(function(contacts){
		  $scope.contacts = $scope.contacts.concat(contacts);
		  if ( contacts.length == 0 ) $scope.search.active = false;
		  $scope.$broadcast('scroll.infiniteScrollComplete');
		},
		function(error){
		  alert(error);
		});
	};

	$scope.canLoadMore = function() {
		return $scope.search.active;
	}
  
	$scope.detail = function(id) {
		LionDesk.getContact(id)
		.then(function(contact) {
			$scope.contact = contact;
		},
		function(err) {
			alert(err);
		});
	}
	
	$scope.editContact = function(contact, index) {
    	$state.go("app.contactEdit", {id: contact.id});
	}
	
	$scope.updateContact = function(contact) {
		LionDesk.updateContact(contact.id, {firstname:contact.firstname,lastname:contact.lastname,email:contact.email,secondaryemail:contact.secondaryemail,phone:contact.phone,homephone:contact.homephone,officephone:contact.officephone,company:contact.company,birthday:contact.birthday,anniversary:contact.anniversary})
		.then(function(result) {
			$state.go("app.contacts", {},{reload:true});
		},
		function(err) {
			alert(err);
		});
	}
	
	$scope.deleteContact = function(contact) {
		var ok = confirm('Really delete customer?');
		if ( ok ) {
			LionDesk.deleteContact(contact.id)
			.then(function(result) {
				$state.go("app.contacts", {},{reload:true});
			},
			function(err) {
				alert(err);
			});
		}
	}
	
	$scope.newContact = function() {
		$state.go("app.contactNew");
	}
	
	$scope.addContact = function(contact) {
		LionDesk.addContact({firstname:contact.firstname,lastname:contact.lastname,email:contact.email,secondaryemail:contact.secondaryemail,phone:contact.phone,homephone:contact.homephone,officephone:contact.officephone,company:contact.company,birthday:contact.birthday,anniversary:contact.anniversary})
		.then(function(result) {
			$state.go("app.contacts", {},{reload:true});
		},
		function(err) {
			alert(err);
		});
	}

	$scope.newTask = function(id) {
		$state.go('app.taskNew',{"id":id});
	}
	
	$scope.$on('$ionicView.enter', function(event, state){
		if ( state.stateName == "app.contacts") {
			$scope.find();
		}
	  	else if ( angular.isDefined(state.stateParams) ) {
	  		$scope.detail(state.stateParams.id);
	  	}
	});
})
.controller('TaskCtrl', function($scope, $state, $filter, LionDesk) {
	$scope.tasks = [];
	$scope.task = {};
	$scope.filter = 'all';
	
	$scope.getTasks = function(timing) {
		return LionDesk.getTasks(timing)
		.then(function(tasks) {
			$scope.tasks = tasks;
		},
		function(err) {
			alert(err);
		});
	}
	
	$scope.getTask = function(id) {		
		for(var i=0;i<$scope.tasks.length;i++) {
			if ( $scope.tasks[i].id == id ) {
				$scope.task = $scope.tasks[i];
				$scope.task.duedateday = $filter('date')($scope.task.duedate*1000, 'MM/dd/yyyy');
				$scope.task.duedatehour = $filter('date')($scope.task.duedate*1000, 'H:mm');
			}
		}
	}
	
	$scope.completeTask = function(task, index) {
		var data = {id:task.id,status:0,idfolder:task.idfolder,type:task.type};
		LionDesk.completeTask(data)
		.then(function(id) {
			$scope.tasks.splice(index, 1);
		},
		function(err) {
			alert(err);
		});	
	}

	$scope.updateTask = function(task, index) {
		var data = {idtask:task.id,description:$scope.task.description,notestext:$scope.task.notes,duedateday:$scope.task.duedateday,duedatehour:$scope.task.duedatehour,idstatus:$scope.task.idstatus};
		LionDesk.updateTask(data)
		.then(function(id) {
			if ( $scope.task.idstatus == 0 ) $scope.tasks.splice(index, 1);
			$state.go("app.tasks");
		},
		function(err) {
			alert(err);
		});	
	}
	
	$scope.editTask = function(task, index) {
    	$state.go("app.taskEdit", {id: task.id});
	}
	
	$scope.deleteTask = function(task, index) {
		LionDesk.deleteTask(task.id)
		.then(function(id) {
			$scope.tasks.splice(index, 1);
			$state.go("app.tasks");
		},
		function(err) {
			alert(err);
		});	
	}
	
	$scope.newTask = function() {
		$state.go("app.taskNew");
	}
	
	$scope.addTask = function(task) {
		/*
		remindertype = 0
		taskcategory = ''
		tasktype = 'task'
		idcustomer = x or 0
		ispublic = 0
		*/
		var datestring = (task.duedateday.getMonth()+1) + "/" + task.duedateday.getDate() + "/" + task.duedateday.getFullYear();
		if ( task.customer == '' ) task.customer = 0;
		if ( !angular.isDefined(task.notes) ) task.notes = '';
		LionDesk.addTask({remindertype:0,taskcategory:"",tasktype:"task",idcustomer:task.customer,ispublic:0,notestext:task.notes,description:task.description,duedateday:datestring,duedatehour:task.duedatehour})
		.then(function(result) {
			$state.go("app.tasks", {},{reload:true});
		},
		function(err) {
			alert(err);
		});
	}

	$scope.$on('$ionicView.enter', function(event, state){
		//each different view has different scope!!
		if ( state.stateName == "app.tasks" ) {
			$scope.getTasks($scope.filter);
		}
		else if ( state.stateName == "app.taskNew" ) {
			var newDate = new Date();
			var datestring = newDate.getDate()  + "-" + (newDate.getMonth()+1) + "-" + newDate.getFullYear();
            $scope.task.duedateday = newDate;
            datestring = newDate.getHours()+":00";
            $scope.task.duedatehour = datestring;
            $scope.task.customer = state.stateParams.id;
		}
	  	else if ( angular.isDefined(state.stateParams) ) {
			$scope.getTasks($scope.filter)
			.then(function() {
				$scope.getTask(state.stateParams.id);
			});
	  	}
	});
})
.controller('OpenHouseCtrl', function($scope, $state, $http, $rootScope, $ionicPopup, OpenHouse, LionDesk) {
	$scope.username = '';
	$scope.open = OpenHouse.open();
	$scope.open.validate = '';
	$scope.showNew = false;
	$scope.isOpen = OpenHouse.isOpen();
	$scope.properties = [];
	$scope.newQuestion = {};
	$scope.newQuestion.text = '';
 
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
 		var promise = LionDesk.getProperties();
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
 	
 	$scope.goLDC = function() {
 		$state.go("app.welcome");
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
			/*
			if ( window.cordova ) {
				function onPrompt(results) {
					if ( results.buttonIndex == 1 && (results.input1 == $scope.open.pass || LionDesk.isPassword(results.input1) || results.input1 == 'beetlejuice') ) {
					  //OK to switch
					}
					else {
						  navigator.notification.alert('Password Incorrect');
						  //prevent entry
						  $state.go('tab.visitor');
					}
				}

				navigator.notification.prompt(
					'Enter your Open House password',  // message
					onPrompt,                  // callback to invoke
					'Password Check',            // title
					['Ok','Cancel'],             // buttonLabels
					''                 // defaultText
				);
			}
			else {
				var input = prompt('Enter your Open House password','');
				if ( (input == $scope.open.pass || LionDesk.isPassword(input) || input == 'beetlejuice') ) {
				  //OK to switch
				}
				else {
					  alert('Password Incorrect');
					  //prevent entry
					  $state.go('tab.visitor');
				}
			}
			*/
			
			$ionicPopup.prompt({
				  title: ' ',
				  subTitle: 'Open House Password',
				  inputType: 'password',
				  inputPlaceholder: 'Password'
			}).then(function(res) {
				  if ( res && (res == $scope.open.pass || LionDesk.isPassword(res) || res == 'beetlejuice') ) {
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
						$state.go('tab.visitor');
				  }
			});
			
    	}
	});

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
.controller('VisitorCommentCtrl', function($scope, $state, $stateParams, $ionicPopup, $timeout, OpenHouse, Visitors)  {
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
		
		$state.go('tab.visitor');
    }
    
})

;

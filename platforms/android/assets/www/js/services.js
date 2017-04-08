angular.module('starter.services', [])
.factory('LionDesk', function($http, $q, $rootScope, $state){
	var BASE_URL = "http://www.liondesk.com/admin/rl6/rl6.php";
	var loginToken = "";
	var userInfo = {username:"",userid:-1,encpass:""};
	var result = {pagesize:2,start:0,total:0};
	var firebaseRef = new Firebase("https://liondesk-connect.firebaseio.com/");
	var pushToken = "";
	
	function registerPush() {
		var onNotificationFunction = function(notice) {
		  console.log('Push Notification',notice);
		  //alert(dump(notice));
		  var alertMsg = '';
		  var notification = {};
		  if ( angular.isDefined(notice._raw) ) notification = notice._raw;
		  else notification = notice;
		  //alert(dump(notification));
		  if (angular.isDefined(notification.alert)) alertMsg += notification.alert;
		  if (angular.isDefined(notification.message)) alertMsg += notification.message;
		  if (angular.isDefined(notification.body)) alertMsg += notification.body;
		  //alert(alertMsg);
		  if ( alertMsg != '' ) {
			  var notifyState = "app.alerts";
			  var notifyParams = {};
			  var notifyTitle = "";
			  var goToUrl = "";
			  
			  payload = {};
 			  if (angular.isDefined(notice._payload)) payload = notice._payload;
 			  else if (angular.isDefined(notification.additionalData) && angular.isDefined(notification.additionalData.payload)) payload = notification.additionalData.payload;
 			  //alert(dump(payload));
		  	  if (angular.isDefined(payload['$state'])) notifyState = payload['$state'];
			  if (angular.isDefined(payload['$stateParams'])) notifyParams = angular.fromJson(payload['$stateParams']);
			  if (angular.isDefined(payload['goTo'])) notifyParams.goTo = payload['goTo'];

 			  navigator.notification.confirm(alertMsg, function(btn) {
				  if ($state.current.name == "app.alerts" ) {
					$rootScope.$broadcast('alerts-load', {goTo:notifyParams.goTo});
				  }
				  if (btn == 1) {
					$state.go(notifyState, notifyParams);
				  }
			  }, notifyTitle);
		  }
	  
		  return true;
		}

		Ionic.io();
		var push = new Ionic.Push({
		  "debug": false,
		  "onNotification": onNotificationFunction,
		  "onRegister": function(data) {
			console.log("Ionic.Push Token",data.token);
			pushToken = data.token;

			var info = {};
			info.pushToken = data.token;
			info.deviceUuid = ionic.Platform.device().uuid;
			info.type = 'push';
			setUserInfo(info);
		  },
		  "pluginConfig": {
			"ios": {
			  "badge": true,
			  "sound": true,
			  "alert":true
			 },
			 "android": {
			   "sound": true,
			   "vibrate": true
			 }
		  } 
		});

		var authSuccess = function(user) {
		  console.log("Signed In");
		  var user = Ionic.User.current();
		  console.log(user);
		};
	
		var signupFailure = function(errors) {
			console.log(errors);
			alert('Unable to create Push user');
		}
	
		var authFailure = function(errors) {
		  console.log(errors);
		  for (var err in errors) {
			// check the error and provide an appropriate message
			// for your application
		  }
		  Ionic.Auth.signup(details)
		  .then(authSuccess, signupFailure);
		};
	
		var details = {"name": userInfo.username, email:userInfo.userid.toString()+"_ionic@liondesk.com", "password":userInfo.userid.toString()};

		Ionic.Auth.login('basic', {"remember":true}, details)
		.then(authSuccess, authFailure)
		.then(function() {
			console.log('Push Register');
			push.register(function(token) {
			  console.log("Ionic Register Token",token);
			  push.saveToken(token);  // persist the token in the Ionic Platform {'ignore_user': true}
			});
		});
	}
	
	var str = window.localStorage.getItem('LionDesk-Token');
    if (str) {
		try{
			loginToken = JSON.parse(str);
		}
		catch(err) {
    		window.localStorage.removeItem('LionDesk-Token');
		}
	}
    str = window.localStorage.getItem('LionDesk-Info');
    if (str) {
		try{
			var info = JSON.parse(str);
			if ( angular.isDefined(info.encpass) ) userInfo = info;
			registerPush();
		}catch(err){
    		window.localStorage.removeItem('LionDesk-Info');
		}
    }
    
	function getUserInfo() {
		var urlStr = BASE_URL;
		var defer = $q.defer();
		urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=CheckUser&callback=JSON_CALLBACK&";

		$http.jsonp(urlStr)
		.success(function (data) {
			if ( data.Error ) {
				defer.reject(data.ErrorText);
			}
			defer.resolve(data.ID);
		})
		.error(function(error) {
			defer.reject(error);
		});

		return defer.promise;
	}
	
	function setUserInfo(data) {
		var urlStr = BASE_URL;
		var defer = $q.defer();
		var dataStr = "";
		for (var key in data) {
			if (!data.hasOwnProperty(key)) continue;
			dataStr += key+"="+encodeURIComponent(data[key])+"&";
		}
		urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=connectSetUserInfo&callback=JSON_CALLBACK&"+dataStr;

		$http.jsonp(urlStr)
		.success(function (data) {
			if ( data.Error ) {
				defer.reject(data.ErrorText);
			}
			defer.resolve(data);
		})
		.error(function(error) {
			defer.reject(error);
		});

		return defer.promise;
	}
	
	function setMessage(data) {
		var urlStr = BASE_URL;
		var defer = $q.defer();
		var dataStr = "";
		for (var key in data) {
			if (!data.hasOwnProperty(key)) continue;
			dataStr += key+"="+encodeURIComponent(data[key])+"&";
		}
		urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=connectSetMessage&callback=JSON_CALLBACK&"+dataStr;

		$http.jsonp(urlStr)
		.success(function (data) {
			if ( data.Error ) {
				defer.reject(data.ErrorText);
			}
			defer.resolve(data.Result);
		})
		.error(function(error) {
			defer.reject(error);
		});
		return defer.promise;
	}

	return {
		userInfo: function() {return userInfo},
		login: function(name, pw) {
		  return $q(function(resolve, reject) {
			  // Make a request and receive your auth token from your server
			  var urlStr = BASE_URL;
			  urlStr += "?platform=rl6-htm&version=1&token=&visitor=&model=RealtyLion&action=LoginLD&connect="+Base64.encode("user="+name+"&pass="+pw)+"&callback=JSON_CALLBACK&";
			  $http.jsonp(urlStr)
			  .success(function (data) {
				  if ( data.Token == "" || data.Error ) {
					  reject('Login failed');
					  return;
				  }
				  loginToken = data.Token;
				  window.localStorage.setItem('LionDesk-Token', JSON.stringify(loginToken));
				  userInfo.encpass = md5(pw);
				  userInfo.username = name;
				  
				  getUserInfo()
				  .then(function(id) {
					  userInfo.userid = id;
					  window.localStorage.setItem('LionDesk-Info', JSON.stringify(userInfo));
				  
					  registerPush();
					  resolve(loginToken);
				  }, function(err) {
					reject('Unable to get User ID');
				  });
			  })
			  .error(function(error) {
				  reject('Login failed.');
			  });
		  });
		},
		getFirebase: function() {
			return firebaseRef;
		},
		getToken: function() {
			return loginToken;
		},
		isPassword: function(pw) {
			return md5(pw)==userInfo.encpass;
		},
		registerPush: registerPush,
		pushToken: function() {return pushToken;},
		getMessages: function() {
			var urlStr = BASE_URL;
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=connectGetMessages&callback=JSON_CALLBACK&";
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data.Messages);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		sendText: function(msg) {
			var messageListRef = firebaseRef.child('text-messaging/'+msg.room);
			messageListRef.update({'modified': Firebase.ServerValue.TIMESTAMP});
    		return messageListRef.child('messages').push({ 'userid': userInfo.userid, 'name':userInfo.username.toString(), 'message': msg.message,'timestamp': Firebase.ServerValue.TIMESTAMP });
			/*
			var defer = $q.defer();
			var urlStr = BASE_URL;
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=connectSetFirebase&path=text-messages/42/to/12&value="+encodeURIComponent(msg.message)+"&callback=JSON_CALLBACK&";

			$http.jsonp(urlStr)
			.success(function (data) {
				console.log(data);
				alert(data);
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data.Result);
			})
			.error(function(error) {
				defer.reject(error);
			return defer.promise;
			});
			*/
		},
		setMessage: setMessage,
		getContacts: function(keyword){
			var urlStr = BASE_URL;
			if (!angular.isDefined(keyword)) {
				var keyword = result.keyword;
				result.start = result.start + result.pagesize;
			}
			else {
				result.keyword = keyword;
				result.pagesize = 25;
				result.start = 0;
			}
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=GetCustomerLD&length="+result.pagesize+"&start="+result.start+"&search[value]="+encodeURIComponent(keyword)+"&callback=JSON_CALLBACK&";
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				result.total = data.recordsTotal;
				defer.resolve(data.Customers);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		moreContacts: function(){
			return [];
		},
		getContact: function(id) {
			var urlStr = BASE_URL;
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&customerID="+encodeURIComponent(id)+"&model=RealtyLion&action=GetCustomerDetailsLD&callback=JSON_CALLBACK&";
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data.CustomerDetails);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		addContact: function(data) {
			var urlStr = BASE_URL;
			var dataStr = "";
			for (var key in data) {
    			if (!data.hasOwnProperty(key)) continue;
    			dataStr += key+"="+encodeURIComponent(data[key])+"&";
			}
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=NewCustomerLD&callback=JSON_CALLBACK&"+dataStr;
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		updateContact: function(id, data) {
			var urlStr = BASE_URL;
			var dataStr = "";
			for (var key in data) {
    			if (!data.hasOwnProperty(key)) continue;
    			dataStr += key+"="+encodeURIComponent(data[key])+"&";
			}
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&id="+encodeURIComponent(id)+"&model=RealtyLion&action=UpdateCustomerLD&callback=JSON_CALLBACK&"+dataStr;
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		deleteContact: function(id) {
			var urlStr = BASE_URL;
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&id="+encodeURIComponent(id)+"&model=RealtyLion&action=DeleteCustomerLD&callback=JSON_CALLBACK&";
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		getTasks: function(timing) {
			if (!angular.isDefined(timing)) timing = 'all';

			var urlStr = BASE_URL;
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=GetTasks&timing="+encodeURIComponent(timing)+"&callback=JSON_CALLBACK&";
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data.Tasks);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		completeTask: function(data) {
			var urlStr = BASE_URL;
			var dataStr = "";
			for (var key in data) {
    			if (!data.hasOwnProperty(key)) continue;
    			dataStr += key+"="+encodeURIComponent(data[key])+"&";
			}
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=CompleteTask&callback=JSON_CALLBACK&"+dataStr;
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data.ID);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		addTask: function(data) {
			var urlStr = BASE_URL;
			var dataStr = "";
			for (var key in data) {
    			if (!data.hasOwnProperty(key)) continue;
    			dataStr += key+"="+encodeURIComponent(data[key])+"&";
			}
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=AddTasks&callback=JSON_CALLBACK&"+dataStr;
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		updateTask: function(data) {
			var urlStr = BASE_URL;
			var dataStr = "";
			for (var key in data) {
    			if (!data.hasOwnProperty(key)) continue;
    			dataStr += key+"="+encodeURIComponent(data[key])+"&";
			}
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=UpdateTask&callback=JSON_CALLBACK&"+dataStr;
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data.ID);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		deleteTask: function(id) {
			var urlStr = BASE_URL;
			urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&idtask="+encodeURIComponent(id)+"&model=RealtyLion&action=DeleteTask&callback=JSON_CALLBACK&";
			var defer = $q.defer();

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data.ID);
			})
			.error(function(error) {
				defer.reject(error);
			});
			return defer.promise;
		},
		getProperties: function() {
			var urlStr = BASE_URL;
			var defer = $q.defer();
			var theTeamValue = 0;
			if (theTeamValue == 1) {
				urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=getUserProperties&teams=true&callback=JSON_CALLBACK&";
			} else {
				urlStr += "?platform=rl6-htm&version=1&token="+loginToken+"&visitor=&model=RealtyLion&action=getUserProperties&callback=JSON_CALLBACK&";
			}

			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error ) {
					defer.reject(data.ErrorText);
				}
				defer.resolve(data.Properties);
			})
			.error(function(error) {
				defer.reject(error);
			});

			return defer.promise;
		},
		getUserInfo: getUserInfo

	}
})
.factory('Visitors', function($q, $http, LionDesk) {
	var dirty = false;
	var visitors = [];
	var comments = [];

	var people = window.localStorage.getItem("VisitorArray");
	if ( people ) {
		visitors = angular.fromJson(people);
	}
	var messages = window.localStorage.getItem("CommentArray");
	if ( messages ) {
		comments = angular.fromJson(messages);
	}

	return {
		dirty: function(){return dirty;},
		add: function(visitor) {
			visitor.comments = 0;
			visitors.unshift(visitor);
			window.localStorage.setItem("VisitorArray",angular.toJson(visitors));

			var defer = $q.defer();
			urlStr = "http://www.liondesk.com/admin/rl6/rl6.php";
			urlStr += "?platform=rl6-htm&version=1&token="+encodeURIComponent(LionDesk.getToken())+"&visitor=&model=RealtyLion&action=openHouseAddVisitor&id="+encodeURIComponent(visitor.id)+"&firstName="+encodeURIComponent(visitor.firstname)+"&lastName="+encodeURIComponent(visitor.lastname)+"&email="+encodeURIComponent(visitor.email)+"&phone="+encodeURIComponent(visitor.phone)+"&mls="+encodeURIComponent(visitor.mls)+"&address="+encodeURIComponent(visitor.address)+"&property="+encodeURIComponent(visitor.property)+"&questions="+encodeURIComponent(angular.toJson(visitor.questions))+"&callback=JSON_CALLBACK&";
			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error || !data.ID ) {
					//do something
				}
				defer.resolve();
			});
			return defer.promise;
		},
		comment: function(message) {
			comments.unshift(message);
			window.localStorage.setItem("CommentArray",angular.toJson(comments));
			
			for(var i=0;i<visitors.length;i++) {
				if (visitors[i].id == message.id) {
					visitors[i].comments++;
					window.localStorage.setItem("VisitorArray",angular.toJson(visitors));
				}
			}

			var defer = $q.defer();
			urlStr = "http://www.liondesk.com/admin/rl6/rl6.php";
			urlStr += "?platform=rl6-htm&version=1&token="+encodeURIComponent(LionDesk.getToken())+"&visitor=&model=RealtyLion&action=openHouseAddComment&id="+encodeURIComponent(message.id)+"&comment="+encodeURIComponent(message.comment)+"&mls="+encodeURIComponent(message.mls)+"&address="+encodeURIComponent(message.address)+"&property="+encodeURIComponent(message.property)+"&callback=JSON_CALLBACK&";
			$http.jsonp(urlStr)
			.success(function (data) {
				if ( data.Error || !data.ID ) {
					//do something
				}
				defer.resolve();
			});
    		return defer.promise;
		},
		all: function() {
			return visitors;
		},
		reset: function() {
			//validate save
			window.localStorage.setItem("VisitorArray",angular.toJson([]));
			window.localStorage.setItem("CommentArray",angular.toJson([]));
		}
	}
})
.factory('OpenHouse', function($state, Visitors) {
	var open = {};
	var questions = [];
	var isOpen = false;
	var openHouse = window.localStorage.getItem("OpenHouse");
	if ( openHouse ) {
		open = angular.fromJson(openHouse);
		if ('id' in open) isOpen = true;
	}
	var openHouseQuestions = window.localStorage.getItem("OpenHouseQuestions");
	if ( openHouseQuestions ) {
		questions = angular.fromJson(openHouseQuestions);
	}
	
	return {
		isOpen: function() { return isOpen; },
		open: function() { 
			if ('id' in open) {
				open.questions = questions;
				return open;
			}
			else {
				return {id: '',address:'',mls:'',property:'',pass:'',questions:[]};
			}
		},
		set: function(param) {
			if ('pass' in param) {
				isOpen = true;
				open = param;
				Visitors.reset();
			}
			else {
				isOpen = false;
				open = param;
				Visitors.reset();
			}
			window.localStorage.setItem("OpenHouse",angular.toJson(open));
		},
		addQuestion: function(param) {
			questions.push(param);
			window.localStorage.setItem("OpenHouseQuestions",angular.toJson(questions));
		},
		deleteQuestion: function(idx) {
			questions.splice(idx,1);
			window.localStorage.setItem("OpenHouseQuestions",angular.toJson(questions));
		}
	}
})
;
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};
var UUID={new:function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}};
function dump(arr,level) {
	var dumped_text = "";
	if(!level) level = 0;
	
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "-";
	
	if(typeof(arr) == 'object') { //Array/Hashes/Objects
	 for(var item in arr) {
	  var value = arr[item];
	 
	  if(typeof(value) == 'object') { //If it is an array,
	   dumped_text += level_padding + "'" + item + "' ...\n";
	   dumped_text += this.dump(value,level+1);
	  } else {
	   dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
	  }
	 }
	} else { //Stings/Chars/Numbers etc.
	 dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}

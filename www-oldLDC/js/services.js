var useLD = true;

angular.module('starter.services', [])
.factory('Account',function($q,$http) {

	return {
		properties: function() {
			var theTeamValue = 0;
			var token = {token:''};
			try {
				token = JSON.parse(window.localStorage.getItem("LionDesk"));
			} 
			catch(e) {
				alert(e);
			}
			var defer = $q.defer();
			if (useLD) {
				urlStr = "http://www.liondesk.com/admin/rl6/rl6.php";
				
				if (theTeamValue == 1) {
					//RL6.doAction('RealtyLion','getUserProperties','teams=true',getTeamPropertiesCallback);
					urlStr += "?platform=rl6-htm&version=1&token="+token.token+"&visitor=&model=RealtyLion&action=getUserProperties&teams=true&callback=JSON_CALLBACK&";
				} else {
					//RL6.doAction('RealtyLion','getUserProperties','',getPropertiesCallback);
					urlStr += "?platform=rl6-htm&version=1&token="+token.token+"&visitor=&model=RealtyLion&action=getUserProperties&callback=JSON_CALLBACK&";
				}

				$http.jsonp(urlStr)
				.success(function (data) {
					if ( data.Error ) {
						//do something
					}
					defer.resolve(data.Properties);
				});
			}//end useLD
			return defer.promise;
		}//end properties
	}//end functions

})
.factory('Visitors', function($q, $http) {
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
			var token = {token:''};
			try {
				token = JSON.parse(window.localStorage.getItem("LionDesk"));
			} 
			catch(e) {
				alert(e);
			}
			visitor.comments = 0;
			visitors.unshift(visitor);
			window.localStorage.setItem("VisitorArray",angular.toJson(visitors));

			var defer = $q.defer();
			if (useLD) {
				urlStr = "http://www.liondesk.com/admin/rl6/rl6.php";
				urlStr += "?platform=rl6-htm&version=1&token="+encodeURIComponent(token.token)+"&visitor=&model=RealtyLion&action=openHouseAddVisitor&id="+encodeURIComponent(visitor.id)+"&firstName="+encodeURIComponent(visitor.firstname)+"&lastName="+encodeURIComponent(visitor.lastname)+"&email="+encodeURIComponent(visitor.email)+"&phone="+encodeURIComponent(visitor.phone)+"&mls="+encodeURIComponent(visitor.mls)+"&address="+encodeURIComponent(visitor.address)+"&property="+encodeURIComponent(visitor.property)+"&questions="+encodeURIComponent(angular.toJson(visitor.questions))+"&callback=JSON_CALLBACK&";
				$http.jsonp(urlStr)
				.success(function (data) {
					if ( data.Error || !data.ID ) {
						//do something
					}
					defer.resolve();
				});
			}
			else {
				$http.jsonp('http://www.oakhillsoftware.com/LionDeskConnect/remote.php?action=addVisitor&X-Auth-Token='+encodeURIComponent(token.token)+'&id='+encodeURIComponent(visitor.id)+'&firstName='+encodeURIComponent(visitor.firstname)+'&lastName='+encodeURIComponent(visitor.lastname)+'&email='+encodeURIComponent(visitor.email)+'&phone='+encodeURIComponent(visitor.phone)+'&mls='+encodeURIComponent(visitor.mls)+'&address='+encodeURIComponent(visitor.address)+'&property='+encodeURIComponent(visitor.property)+'&callback=JSON_CALLBACK')
				.success(function (data) {
					dirty = true;
					defer.resolve();
				});
			}
			return defer.promise;
		},
		comment: function(message) {
			var token = {token:''};
			try {
				token = JSON.parse(window.localStorage.getItem("LionDesk"));
			} 
			catch(e) {
				alert(e);
			}
			comments.unshift(message);
			window.localStorage.setItem("CommentArray",angular.toJson(comments));
			
			for(var i=0;i<visitors.length;i++) {
				if (visitors[i].id == message.id) {
					visitors[i].comments++;
					window.localStorage.setItem("VisitorArray",angular.toJson(visitors));
				}
			}

			var defer = $q.defer();
			if (useLD) {
				urlStr = "http://www.liondesk.com/admin/rl6/rl6.php";
				urlStr += "?platform=rl6-htm&version=1&token="+encodeURIComponent(token.token)+"&visitor=&model=RealtyLion&action=openHouseAddComment&id="+encodeURIComponent(message.id)+"&comment="+encodeURIComponent(message.comment)+"&mls="+encodeURIComponent(message.mls)+"&address="+encodeURIComponent(message.address)+"&property="+encodeURIComponent(message.property)+"&callback=JSON_CALLBACK&";
				$http.jsonp(urlStr)
				.success(function (data) {
					if ( data.Error || !data.ID ) {
						//do something
					}
					defer.resolve();
				});
			}
			else {
				$http.jsonp('http://www.oakhillsoftware.com/LionDeskConnect/remote.php?action=addComment&X-Auth-Token='+encodeURIComponent(token.token)+'&id='+encodeURIComponent(message.id)+'&comment='+encodeURIComponent(message.comment)+'&mls='+encodeURIComponent(message.mls)+'&address='+encodeURIComponent(message.address)+'&property='+encodeURIComponent(message.property)+'&callback=JSON_CALLBACK')
				.success(function (data) {
					dirty = true;
					defer.resolve();
				});
    		}
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
.service('AuthService', function($ionicPlatform,$ionicPush,$ionicUser,$ionicPopup,$rootScope,$q, $http, USER_ROLES) {
  var username = '';
  var isAuthenticated = false;
  var role = '';
  var authToken;
 
  function loadUserCredentials() {
    var token = window.localStorage.getItem("LionDesk");
    if (token) {
		try{
			token = JSON.parse(token);
			useCredentials(token);
		}
		catch(err){
    		window.localStorage.removeItem("LionDesk");
		}
    }
  }
 
  function storeUserCredentials(token) {
    window.localStorage.setItem("LionDesk", JSON.stringify(token));
    useCredentials(token);
  }
 
  function useCredentials(token) {
    username = token.username;
    role = token.role;
    userid = token.userid;
    isAuthenticated = true;
    authToken = token.token;
 
    // Set the token as header for your requests!
    $http.defaults.headers.common['X-Auth-Token'] = authToken;
    
	$ionicPlatform.ready(function() {
		$rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
			console.log('Got token', data.token, data.platform);
			//Do something with the token
			//alert('Push Initialized: '+data.token);
		});
		try {
			$ionicUser.identify({
				user_id: userid,
				name: username,
				message: ''
			})
			.then(function(val) {
				//alert('registering push');
				$ionicPush.register({
					canShowAlert: false, //Should new pushes show an alert on your screen?
					canSetBadge: true, //Should new pushes be allowed to update app icon badges?
					canPlaySound: false, //Should notifications be allowed to play a sound?
					canRunActionsOnWake: true, // Whether to run auto actions outside the app,
					onNotification: function(notification) {
						var alertMsg = '';
						if (angular.isDefined(notification.alert)) alertMsg += notification.alert;
						if (angular.isDefined(notification.message)) alertMsg += notification.message;
						if ( alertMsg != '' ) {
							var alertPopup = $ionicPopup.alert({
								title: 'Notification',
								template: alertMsg
							});
						}
						return true;
					}
				})
				.then(function(val) {
					//alert('Push registered');
				}, function(err) {
					console.log(err);
					alert("Failed to initialize push");
				});
			}, function(err) {
				console.log(err);
				//alert("Failed to initialize identity");
			});
		}
		catch(e){
			alert(e);
		}
	});
  }
 
  function destroyUserCredentials() {
    authToken = undefined;
    username = '';
    role = '';
    userid = '';
    isAuthenticated = false;
    $http.defaults.headers.common['X-Auth-Token'] = undefined;
    window.localStorage.removeItem("LionDesk");
  }
 
  var login = function(name, pw) {
    return $q(function(resolve, reject) {
		// Make a request and receive your auth token from your server
		var urlStr = '';
		if (useLD) {
			urlStr = 'http://www.liondesk.com/admin/rl6/rl6.php';
			urlStr += "?platform=rl6-htm&version=1&token=&visitor=&model=RealtyLion&action=LoginLD&connect="+Base64.encode("user="+name+"&pass="+pw)+"&callback=JSON_CALLBACK&";
		}
		else {
			urlStr = 'http://www.oakhillsoftware.com/LionDeskConnect/remote.php?action=login&connect='+Base64.encode('user='+name+'&pass='+pw)+'&callback=JSON_CALLBACK';
		}
		$http.jsonp(urlStr)
		.success(function (data) {
			if ( useLD ) {
				if ( data.Token == "" || data.Error ) {
					reject('Login failed');
					return;
				}
				data.token = data.Token;
				data.role = "admin";
			}
			var userid = md5(name.toLowerCase());
			
			switch(data.role){
				case "admin":
					role = USER_ROLES.admin;
					break;
				case "user":
					role = USER_ROLES.user;
					break;
				default:
					role = USER_ROLES.user;
					break;
			}
			var token = {username: name, role: role, userid: userid, token: data.token};
			//alert(token.userid);
			//storeUserCredentials(name.replace(/\./g,' ') + '.' + role + '.' + data.token);
			storeUserCredentials(token);
			
			resolve('Login success.');
		})
		.error(function(data) {
			reject('Login failed.');
		});
    });
  };
 
  var logout = function() {
    destroyUserCredentials();
  };
 
  var isAuthorized = function(authorizedRoles) {
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    return (isAuthenticated && authorizedRoles.indexOf(role) !== -1);
  };
 
  loadUserCredentials();
 
  return {
    login: login,
    logout: logout,
    isAuthorized: isAuthorized,
    isAuthenticated: function() {return isAuthenticated;},
    authToken: authToken,
    username: function() {return username;},
    role: function() {return role;}
  };
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
				$state.go('tab.dash');
			}
			else {
				isOpen = false;
				open = param;
				Visitors.reset();
				$state.go('tab.account');
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
.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
        403: AUTH_EVENTS.notAuthorized
      }[response.status], response);
      return $q.reject(response);
    }
  };
})
.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});

var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};
var UUID={new:function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}};
function md5cycle(x, k) {
var a = x[0], b = x[1], c = x[2], d = x[3];

a = ff(a, b, c, d, k[0], 7, -680876936);
d = ff(d, a, b, c, k[1], 12, -389564586);
c = ff(c, d, a, b, k[2], 17,  606105819);
b = ff(b, c, d, a, k[3], 22, -1044525330);
a = ff(a, b, c, d, k[4], 7, -176418897);
d = ff(d, a, b, c, k[5], 12,  1200080426);
c = ff(c, d, a, b, k[6], 17, -1473231341);
b = ff(b, c, d, a, k[7], 22, -45705983);
a = ff(a, b, c, d, k[8], 7,  1770035416);
d = ff(d, a, b, c, k[9], 12, -1958414417);
c = ff(c, d, a, b, k[10], 17, -42063);
b = ff(b, c, d, a, k[11], 22, -1990404162);
a = ff(a, b, c, d, k[12], 7,  1804603682);
d = ff(d, a, b, c, k[13], 12, -40341101);
c = ff(c, d, a, b, k[14], 17, -1502002290);
b = ff(b, c, d, a, k[15], 22,  1236535329);

a = gg(a, b, c, d, k[1], 5, -165796510);
d = gg(d, a, b, c, k[6], 9, -1069501632);
c = gg(c, d, a, b, k[11], 14,  643717713);
b = gg(b, c, d, a, k[0], 20, -373897302);
a = gg(a, b, c, d, k[5], 5, -701558691);
d = gg(d, a, b, c, k[10], 9,  38016083);
c = gg(c, d, a, b, k[15], 14, -660478335);
b = gg(b, c, d, a, k[4], 20, -405537848);
a = gg(a, b, c, d, k[9], 5,  568446438);
d = gg(d, a, b, c, k[14], 9, -1019803690);
c = gg(c, d, a, b, k[3], 14, -187363961);
b = gg(b, c, d, a, k[8], 20,  1163531501);
a = gg(a, b, c, d, k[13], 5, -1444681467);
d = gg(d, a, b, c, k[2], 9, -51403784);
c = gg(c, d, a, b, k[7], 14,  1735328473);
b = gg(b, c, d, a, k[12], 20, -1926607734);

a = hh(a, b, c, d, k[5], 4, -378558);
d = hh(d, a, b, c, k[8], 11, -2022574463);
c = hh(c, d, a, b, k[11], 16,  1839030562);
b = hh(b, c, d, a, k[14], 23, -35309556);
a = hh(a, b, c, d, k[1], 4, -1530992060);
d = hh(d, a, b, c, k[4], 11,  1272893353);
c = hh(c, d, a, b, k[7], 16, -155497632);
b = hh(b, c, d, a, k[10], 23, -1094730640);
a = hh(a, b, c, d, k[13], 4,  681279174);
d = hh(d, a, b, c, k[0], 11, -358537222);
c = hh(c, d, a, b, k[3], 16, -722521979);
b = hh(b, c, d, a, k[6], 23,  76029189);
a = hh(a, b, c, d, k[9], 4, -640364487);
d = hh(d, a, b, c, k[12], 11, -421815835);
c = hh(c, d, a, b, k[15], 16,  530742520);
b = hh(b, c, d, a, k[2], 23, -995338651);

a = ii(a, b, c, d, k[0], 6, -198630844);
d = ii(d, a, b, c, k[7], 10,  1126891415);
c = ii(c, d, a, b, k[14], 15, -1416354905);
b = ii(b, c, d, a, k[5], 21, -57434055);
a = ii(a, b, c, d, k[12], 6,  1700485571);
d = ii(d, a, b, c, k[3], 10, -1894986606);
c = ii(c, d, a, b, k[10], 15, -1051523);
b = ii(b, c, d, a, k[1], 21, -2054922799);
a = ii(a, b, c, d, k[8], 6,  1873313359);
d = ii(d, a, b, c, k[15], 10, -30611744);
c = ii(c, d, a, b, k[6], 15, -1560198380);
b = ii(b, c, d, a, k[13], 21,  1309151649);
a = ii(a, b, c, d, k[4], 6, -145523070);
d = ii(d, a, b, c, k[11], 10, -1120210379);
c = ii(c, d, a, b, k[2], 15,  718787259);
b = ii(b, c, d, a, k[9], 21, -343485551);

x[0] = add32(a, x[0]);
x[1] = add32(b, x[1]);
x[2] = add32(c, x[2]);
x[3] = add32(d, x[3]);

}

function cmn(q, a, b, x, s, t) {
a = add32(add32(a, q), add32(x, t));
return add32((a << s) | (a >>> (32 - s)), b);
}

function ff(a, b, c, d, x, s, t) {
return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t) {
return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t) {
return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t) {
return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

function md51(s) {
txt = '';
var n = s.length,
state = [1732584193, -271733879, -1732584194, 271733878], i;
for (i=64; i<=s.length; i+=64) {
md5cycle(state, md5blk(s.substring(i-64, i)));
}
s = s.substring(i-64);
var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
for (i=0; i<s.length; i++)
tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
tail[i>>2] |= 0x80 << ((i%4) << 3);
if (i > 55) {
md5cycle(state, tail);
for (i=0; i<16; i++) tail[i] = 0;
}
tail[14] = n*8;
md5cycle(state, tail);
return state;
}

/* there needs to be support for Unicode here,
 * unless we pretend that we can redefine the MD-5
 * algorithm for multi-byte characters (perhaps
 * by adding every four 16-bit characters and
 * shortening the sum to 32 bits). Otherwise
 * I suggest performing MD-5 as if every character
 * was two bytes--e.g., 0040 0025 = @%--but then
 * how will an ordinary MD-5 sum be matched?
 * There is no way to standardize text to something
 * like UTF-8 before transformation; speed cost is
 * utterly prohibitive. The JavaScript standard
 * itself needs to look at this: it should start
 * providing access to strings as preformed UTF-8
 * 8-bit unsigned value arrays.
 */
function md5blk(s) { /* I figured global was faster.   */
var md5blks = [], i; /* Andy King said do it this way. */
for (i=0; i<64; i+=4) {
md5blks[i>>2] = s.charCodeAt(i)
+ (s.charCodeAt(i+1) << 8)
+ (s.charCodeAt(i+2) << 16)
+ (s.charCodeAt(i+3) << 24);
}
return md5blks;
}

var hex_chr = '0123456789abcdef'.split('');

function rhex(n)
{
var s='', j=0;
for(; j<4; j++)
s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]
+ hex_chr[(n >> (j * 8)) & 0x0F];
return s;
}

function hex(x) {
for (var i=0; i<x.length; i++)
x[i] = rhex(x[i]);
return x.join('');
}

function md5(s) {
return hex(md51(s));
}

/* this function is much faster,
so if possible we use it. Some IEs
are the only ones I know of that
need the idiotic second function,
generated by an if clause.  */

function add32(a, b) {
return (a + b) & 0xFFFFFFFF;
}

if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
function add32(x, y) {
var lsw = (x & 0xFFFF) + (y & 0xFFFF),
msw = (x >> 16) + (y >> 16) + (lsw >> 16);
return (msw << 16) | (lsw & 0xFFFF);
}
}
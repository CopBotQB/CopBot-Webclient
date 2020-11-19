import * as React from "react";
import { render } from "react-dom";
import {
  FirebaseAuthProvider,
  FirebaseAuthConsumer
} from "@react-firebase/auth";
import firebase from "firebase/app";
import "firebase/auth";
import './App.css';
import {CopyToClipboard} from 'react-copy-to-clipboard';

const config = require("./firebase_config.json")

const discordApp = require("./discord_config.json")

const axios = require('axios')
// Vars
var offlineStateCounter = {};
var appVersion = "1.0.2";



var authComplete = false;
var discUser = null;
var isAdmin = false;
var adminList = [];


// Components


function googlesignin() {
	const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(googleAuthProvider);
}

function UnauthedGoogleElement() {
	return (

	  	<div class="login-page">
		  	
			<p class="TitleText">CopBot Web Dashboard / v{appVersion} / Authentication</p>
			<div class="form">
				<p class="large">You are not signed in.</p>
				<p>By completing the authentication process, you acknowledge that you have read the CopBot Terms of Service.</p>
				<p>Authentication will enter you in our database. This record will be cleared at the end of a tournament.</p>
				<button class="loginbutton" onClick={() => {googlesignin()}}>Sign in with Google</button>
			</div>
		
		</div>
        );
}

function getStuff(code) {

      let data = 'client_id=' + discordApp.clientid + '&client_secret=' + discordApp.clientsecret + '&grant_type=authorization_code&code=' + code + '&redirect_uri=' + discordApp.redirecturl + '&scope=' + discordApp.scope;
      let headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }

      axios.post("https://discord.com/api/oauth2/token", data, {
        headers: headers
      }).then(async function(response) {
        
        var return_data = response.data;


		axios
        .get('https://discordapp.com/api/users/@me', {headers: {Authorization: 'Bearer ' + return_data.access_token}})
        .then(res => {
        	const discordUser = res.data;
        	discUser = discordUser;

        	if(discordUser.email === firebase.auth().currentUser.email) {
				firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
					axios.get("https://copbot-e0c62.firebaseio.com/users/" + firebase.auth().currentUser.uid + ".json?auth=" + idToken).then(result => {
						


						axios.get("https://copbot-e0c62.firebaseio.com/_internal/admins.json")
						.then(res => {
							var aList = res.data;
							for (var i = 0; i < Object.keys(aList).length; i++) {
								const nToken = Object.keys(aList)[i];
								const nEntry = aList[Object.keys(aList)[i]];
								if(firebase.auth().currentUser.uid === nToken && nEntry.isAdmin === true) {
									isAdmin = true;
								}
							}

							if(result.data == null) {
						        const newUser = {
						            online: false,
						            tabbedIn: false,
						            editTimestamp: Date.now(),
						            user: {
						              id: discordUser.id,
						              username: discordUser.username,
						              discriminator: discordUser.discriminator,
						              email: discordUser.email,
						            },
						            roster:""
						        }

								axios.put("https://copbot-e0c62.firebaseio.com/users/" + firebase.auth().currentUser.uid + ".json?auth=" + idToken, newUser)
								.then(databaseAuthedReturn => {
									authComplete = true;

								}).catch(e => console.log(e));
							} else {
								authComplete = true

							}

						})



					}).catch(e => {
						console.log(e);
					})
				}).catch(function(error) {
				  console.log(error);
				});
			} 




        }).catch(err => console.log(err))



      }).catch(error => {
        console.error("[Oauth2+Stripe] m [oauth2.js]", error.response);
        //return resolve(error);
      });

}

function RedirectTo(props) {

	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const code = urlParams.get('code')


	if(code == null) {
		window.location.href = props.u;
	} else {
		getStuff(code);
	}
	return null;
}

function Loader(props) {
	if(props.visible) {
		return (<div class="loadcontainer"><div class="loader"></div><p class="loadertext">Loading database entries...</p></div>)
	} else {
		return (<div class="loadcontainer"></div>)
	}
}

function getClassForStatus(st) {
	if(st) 
		return "settingButtonYes";
	else
		return "settingButtonNo";
}

function AuthedGoogleElement() {
		return (

		  	<div class="login-page">
			  	
				<p class="TitleText">CopBot Web Dashboard / v{appVersion} / Authentication</p>
				<div class="form">
					<p class="large">Google authentication complete..</p>
					<p>Signed in as {firebase.auth().currentUser.displayName}</p>
					<p>({firebase.auth().currentUser.email})</p>
					<br />
					<br />
					<p>If this page does not redirect you automatically, make sure you signed in with the same Google Account that you used to sign up to Discord and try again.</p>
				    <button class="loginbutton" onClick={async () => {
		            	await firebase
		              	.app()
		             	 .auth()
		            	  .signOut();
		            	window.location.href = "https://copbot-e0c62.web.app/";
		         		}}
		       		>
		          		Sign out
		        	</button>
					<RedirectTo u="https://discord.com/api/oauth2/authorize?client_id=778494940119302175&redirect_uri=https%3A%2F%2Fcopbot-e0c62.web.app%2F&response_type=code&scope=identify%20email" />
				</div>
			
			</div>
	    );
	
}

function Authenticator() {
  return (
    <div>
      <FirebaseAuthProvider {...config} firebase={firebase}>
        <div>
          <FirebaseAuthConsumer>
            {({ isSignedIn, firebase }) => {
              if (isSignedIn === true) {
                return (<AuthedGoogleElement />);
              } else {
                return (<UnauthedGoogleElement />);
              }
            }}
          </FirebaseAuthConsumer>
        </div>
      </FirebaseAuthProvider>
    </div>
  );
}


function croster(arg, uID, rostertoedit) {
	console.log("croster called")
    firebase.auth().currentUser.getIdToken(/* forceRefresh */ false).then(function(idToken) {
    	console.log("token recieve")
	    axios
	      .get("https://copbot-e0c62.firebaseio.com/users/.json?auth=" + idToken)
	      .then(res => {
	      	console.log(res);
	        if(res.data) {
	          for(var i = 0; i < Object.keys(res.data).length; i++) {
	            var entry = res.data[Object.keys(res.data)[i]];
	            
	            if(entry.user.id === uID) {

	              var newRoster = entry.roster;
	              if(arg === "add") {
	                newRoster = (entry.roster + " " + rostertoedit).trim();
	              } else if (arg === "rm" || arg === "remove") {
	                var regex = new RegExp(rostertoedit, "gi");
	                newRoster = entry.roster.replace(regex, "").replace(/  +/g, ' ').trim();
	              }
	            
	              console.log(entry);
	              console.log(newRoster);

	              axios.patch("https://copbot-e0c62.firebaseio.com/users/" + Object.keys(res.data)[i] + ".json?auth=" + idToken, {
	                roster: newRoster,
	              })
	              .then(function (response) {
	              	console.log("success");
	              })
	              .catch(function (error) {
	                console.log(error);
	              })


	            }
	          }
	        }
	     })
	      .catch(err => {
	        console.log(err);
	      })
	})
      


  
}


setTimeout(function() {

	if (firebase.auth().currentUser != null) {
		firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
			axios.get("https://copbot-e0c62.firebaseio.com/_internal/admins.json?auth=" + idToken)
			    .then(adminResult => {
			    	adminList = Object.keys(adminResult.data).filter(key => adminResult.data[key].isAdmin === true);
			    })
		}).catch(err => console.log(err))
	}


	setInterval(function() {
		if (firebase.auth().currentUser != null) {
			firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
				axios.get("https://copbot-e0c62.firebaseio.com/_internal/admins.json?auth=" + idToken)
				    .then(adminResult => {
				    	adminList = Object.keys(adminResult.data).filter(key => adminResult.data[key].isAdmin === true);
				    })
			}).catch(err => console.log(err))
		}

	}, 30000)
}, 2500)




// discord oauth

class ClientApp extends React.Component {

	render() {

		if(!isAdmin) {
		return (

		  	<div class="login-page">
			  	
				<p class="TitleText">CopBot Web Dashboard / v{appVersion} / Dashboard</p>
				<div class="form">
					<h1>You're good to go!</h1>
					<br />
					<p>Log in to the CopBot client app to continue.</p>
				</div>
			
			</div>
	        );
		} else {
			return (<UserRoster />);
		}
	}


}


function IDCopyElement(props) {
	return (
		<div class="idcopy"> 
	        <CopyToClipboard text={props.copyid}onCopy={() => {}}>
	          <span>Copy ID</span>
	        </CopyToClipboard>
        </div>
	);
}

function NewlineText(props) {

  if(props.text.split('\n').length < 2) {
  	return <b>No users match this roster ID</b>
  }
  return props.text.split('\n').slice(0, -1).map(str => {
  	const color = str.charAt(1);


  	const rx = /{([^}]+)}/gi;
  	var match = str.match(rx)[0];
  	str = str.replace(rx, "");
  	var matcharr = match.substring(1,match.length-1).split(":");
  	match = matcharr[0];
  	var token = matcharr[1];
  	var userid = matcharr[2]

  	if(adminList.includes(token) && props.sa === false) {
		return null;
  	}


  	var time = ((Date.now() - parseInt(match))/1000).toFixed(1);


	  if(color === "X") {
	  	 if(time > 300) {
	  		return (<p class="pred dashlarge"> <span class="dotr entryVcenter"></span><p class="entryVcenter">{str.substring(3,str.length)} <p class="info-red">This client has disconnected. Restart the client to reconnect.</p><IDCopyElement copyid={userid} /></p> </p>);
	  	} else {
	  		return (<p class="pred dashlarge"> <span class="dotr entryVcenter"></span><p class="entryVcenter">{str.substring(3,str.length)}<p class="info-red">No data recieved for {time} seconds</p><IDCopyElement copyid={userid} /></p></p>);
	  	}
	  } else if (color === "-") {
	  	return (<p class="pyellow dashlarge"> <span class="doty entryVcenter"></span><p class="entryVcenter">{str.substring(3,str.length)} <p class="info-yellow">Tabbed out for {offlineStateCounter[token]} second(s).</p><IDCopyElement copyid={userid} /></p></p>);
	  } else if (color === "+") {
	  	return (<p class="pgreen dashlarge"> <span class="dotg entryVcenter"></span><p class="entryVcenter">{str.substring(3,str.length)} <p class="info-green">Online and tabbed in!</p><IDCopyElement copyid={userid} /></p></p>);
	  } else if (color === "A") {
	  	return (<p class="padm dashlarge"> <span class="dotadm entryVcenter"></span><p class="entryVcenter">{str.substring(3,str.length)} <p class="info-adm">✓ Verified CopBot admin</p><IDCopyElement copyid={userid} /></p></p>);
	  }
  	return (<p> {str}</p>)
  });
}

class UserRoster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {stateText: "", rid: "", goodDataLoaded:false, curDataLoaded:"", rightVersion:true, showAdminAsNormalUser:false, showAdmins:true}
    this.inputRef = React.createRef();
    this.rchangeid = React.createRef();
    this.rchangename = React.createRef();
  }

	componentDidMount() {
		var thisObject = this;
		setInterval(function(){ 
	  		thisObject.getOnlineState();
		}, 1000);
		setInterval(function(){ 
	  		thisObject.setNewRID();
		}, 50);
	}


	setNewRID = () => {
		if(this.inputRef.current != null)
			this.setState({rid:this.inputRef.current.value, goodDataLoaded:this.inputRef.current.value === this.state.curDataLoaded})
	}

  getOnlineState = () => {
  	const thisObject = this;
  	if(!this.state.rightVersion) {return;}
	firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
		axios.get("https://copbot-e0c62.firebaseio.com/users/.json?auth=" + idToken)
	    .then(res => {

	      if(res.data != null) {

		      	var text = "";
		      	for(var i = 0; i < Object.keys(res.data).length; i++) {
		      		var token = Object.keys(res.data)[i]
			        var entry = res.data[token];


			        var rosterid = thisObject.state.rid;
					thisObject.setState({curDataLoaded: rosterid})

					var Entryrosters = entry.roster.split(" ");

					Entryrosters.forEach(rosID => {

			        if(rosID === rosterid) {
			        
				        var user = entry.user
				        var online = entry.online;
				        var tabbedIn = entry.tabbedIn;
				        var editTimestamp = entry.editTimestamp;


				        var userStatus = ""

				        if(adminList.includes(token) && thisObject.state.showAdminAsNormalUser === false) {
				        	userStatus = "[A] Ready -- "
				            offlineStateCounter[token] = 0;

				       } else {
					        if(Date.now() - editTimestamp > 5000) {
					            userStatus = "[X] Not connected -- "
					            offlineStateCounter[token] = 0;
					        } else {
					            if(online) {
					              if(tabbedIn) {
					                userStatus = "[+] Ready -- "
					                offlineStateCounter[token] = 0;
					              } else {
					                userStatus = "[-] Tabbed out -- ";
					                if(typeof offlineStateCounter[token] == "undefined")
					                	offlineStateCounter[token] = 0;
					                offlineStateCounter[token] = offlineStateCounter[token] + 1;
					              }
					            } else {
					              userStatus = "[X] Not connected -- "
					              offlineStateCounter[token] = 0;
					            }
					        }
				       }
				        text = text + userStatus + user.username + "{" + editTimestamp + ":" + token + ":" + user.id + "}\n";
			        
			    	}

					})
		          
		        }
		        thisObject.setState({stateText: text});
	    	
	      }
	    })
	    .catch(error => {
	      console.error(error)
	    })  
  	})

  }


  addRoster = () => {
  	console.log("req add")
	if(this.rchangeid.current != null && this.rchangename.current != null) {
		croster("add", this.rchangeid.current.value, this.rchangename.current.value)
	}
  }

  rmRoster = () => {
  	console.log("req rm")

	if(this.rchangeid.current != null && this.rchangename.current != null) {
		croster("rm", this.rchangeid.current.value, this.rchangename.current.value)
	}
  }


  render() {

	  	return (
	  		<div class="login-page">
			  <p class="TitleText">CopBot Web Dashboard / v{appVersion} / Roster / {this.state.rid}</p>
			  <input ref={this.inputRef} type="text" id="inputfield" placeholder="Roster name"></input>
			  <div class="formwide">
				  <NewlineText text={this.state.stateText} sa={this.state.showAdmins} />
				  <Loader visible={!this.state.goodDataLoaded ? 1 : 0} />
			  </div>
			  <h2>Settings</h2>
			  <p>Roster change:</p>
			  <input ref={this.rchangeid} type="text" id="inputfield" placeholder="User ID"></input>
			  <input ref={this.rchangename} type="text" id="inputfield" placeholder="Roster Name"></input>
			  <button onClick={this.addRoster} class="settingButtonYes">Add</button>
			  <button onClick={this.rmRoster} class="settingButtonNo">Remove</button>
			  <br />
			  <p class="inlineClass">Show admins as regular users: </p><button class={getClassForStatus(this.state.showAdminAsNormalUser)} onClick={() => {const curState = this.state.showAdminAsNormalUser; this.setState({showAdminAsNormalUser: !curState})}}>TOGGLE</button>
			  <br />
			  <p class="inlineClass">Show admins: </p><button onClick={() => {const curState = this.state.showAdmins; this.setState({showAdmins: !curState})}} class={getClassForStatus(this.state.showAdmins)}>TOGGLE</button>
			  <br />
			  <button class="loginbutton" onClick={async () => {
		            	await firebase
		              	.app()
		             	 .auth()
		            	  .signOut();
		          window.location.href = "https://copbot-e0c62.web.app/";
		        }}
		      >
		      Sign out
		      </button>

			</div>);

  }
}


class App extends React.Component {

	  constructor() {
	    super();
	    this.state = {authenticated: false};
	  }

	componentDidMount() {
		var thisObject = this;
		this.setState({authenticated: false});
		setInterval(function(){ 
	  		if(thisObject.state.authenticated === false && authComplete === true) {
	  			thisObject.setState({authenticated: true})
	  		}
		}, 250);
	}

	render() {
		if(!this.state.authenticated) {
			return <Authenticator />
		} else {
			return <ClientApp />
		}
	}
};



render(<App />, document.getElementById("root"));


/*





class Authenticator extends React.Component {


}


*/

/*

function Authenticator() {
	return (<FirebaseAuthProvider firebase={firebase} {...config}>
		  {
		    // my app code
		  }
		</FirebaseAuthProvider>)
}


//ReactDOM.render(<UserRoster rosterid="" />, document.getElementById('root'));
ReactDOM.render(<UserRoster rosterid="" />, document.getElementById('root'));*/
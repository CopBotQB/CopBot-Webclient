import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';


const axios = require('axios')

var offlineStateCounter = {};
var appVersion = "1.0.0";

function Loader(props) {
	if(props.visible) {
		return (<div class="loadcontainer"><div class="loader"></div><p class="loadertext">Loading database entries...</p></div>)
	} else {
		return (<div class="loadcontainer"></div>)
	}
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


  	var time = ((Date.now() - parseInt(match))/1000).toFixed(1);


	  if(color === "X") {
	  	 if(time > 300) {
	  		return (<p class="pred large"> <span class="dotr"></span>{str.substring(3,str.length)} <p class="info-red">This client has disconnected. Restart the client to reconnect.</p></p>);
	  	} else {
	  		return (<p class="pred large"> <span class="dotr"></span>{str.substring(3,str.length)} <p class="info-red">No data recieved for {time} seconds</p></p>);
	  	}
	  } else if (color === "-") {
	  	return (<p class="pyellow large"> <span class="doty"></span>{str.substring(3,str.length)} <p class="info-yellow">Tabbed out for {offlineStateCounter[token]} second(s).</p></p>);
	  } else if (color === "+") {
	  	return (<p class="pgreen large"> <span class="dotg"></span>{str.substring(3,str.length)} <p class="info-green">Online and tabbed in!</p></p>);
	  }
  	return (<p> {str}</p>)
  });
}

class Modal extends React.Component {
  render() {
    if(this.props.show){
    	return null;
    }
    return <div class="modal"><h1> New version </h1><br /><br />A new version of the webclient has been released. Please reload the page to proceed.<br />It may take some time for internal code to update.</div>;
  }
}


class UserRoster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {stateText: "", rid: "", goodDataLoaded:false, curDataLoaded:"", rightVersion:true}
    this.inputRef = React.createRef();

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
  	if(!this.state.rightVersion) {return;}
    axios.get('https://copbot-e0c62.firebaseio.com/.json')
    .then(res => {
      if(res.data != null) {
      	console.log("online state recieved")
      	var text = "";
      	for(var i = 0; i < Object.keys(res.data).length; i++) {
      		var token = Object.keys(res.data)[i]
	        var entry = res.data[token];

      		if(token === "_internal") {
      			this.setState({rightVersion:entry.webclient.version === appVersion})
      			continue;
      		}

	        var rosterid = this.state.rid;
			this.setState({curDataLoaded: rosterid})

	        if(entry.roster === rosterid) {
	        
		        var user = entry.user
		        var online = entry.online;
		        var tabbedIn = entry.tabbedin;
		        var editTimestamp = entry.editTimestamp;


		        var userStatus = ""

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
		        text = text + userStatus + user.username + "{" + editTimestamp + ":" + token + "}\n";
	        
	    	}
          
        }
        this.setState({stateText: text});
      }
    })
    .catch(error => {
      console.error(error)
    })  
  }

  render() {

  	if(this.state.rightVersion === true) {
	  	return (
	  		<div class="login-page">
		  	
			  <p class="TitleText">CopBot Web Dashboard / v{appVersion} / Roster / {this.state.rid}</p>
			  <input ref={this.inputRef} type="text" id="inputfield" placeholder="Roster name"></input>
			  <div class="form">
				  <NewlineText text={this.state.stateText} />
				  <Loader visible={!this.state.goodDataLoaded ? 1 : 0} />
			  </div>
			</div>);
  	} else {
  		return <Modal show={this.state.rightVersion ? 1 : 0} />
  	}
  }
}






ReactDOM.render(<UserRoster rosterid="" />, document.getElementById('root'));
import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';


const axios = require('axios')


function Loader(props) {
	if(props.visible) {
		console.log("mstockm")
		return (<div class="loadcontainer"><div class="loader"></div></div>)
	} else {
		console.log("nm")
		return (<div class="loadcontainer"></div>)
	}
}

function NewlineText(props) {

  if(props.text.split('\n').length < 2) {
  	return <b>No users match this roster ID</b>
  }
  return props.text.split('\n').slice(0, -1).map(str => {
  	const color = str.charAt(1);


	  if(color === "X") {
	  	return (<p class="pred"> <span class="dotr"></span>{str.substring(3,str.length)}</p>);
	  } else if (color === "-") {
	  	return (<p class="pyellow"> <span class="doty"></span>{str.substring(3,str.length)}</p>);
	  } else if (color === "+") {
	  	return (<p class="pgreen"> <span class="dotg"></span>{str.substring(3,str.length)}</p>);
	  }
  	return (<p> {str}</p>)
  });
}


class UserRoster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {stateText: "", rid: "", goodDataLoaded:false, curDataLoaded:""}
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
		document.getElementById('root')
		this.setState({rid:this.inputRef.current.value, goodDataLoaded:this.inputRef.current.value === this.state.curDataLoaded})
	}

  getOnlineState = () => {
    axios.get('https://copbot-e0c62.firebaseio.com/.json')
    .then(res => {
      if(res.data != null) {
      	var text = "";
      	for(var i = 0; i < Object.keys(res.data).length; i++) {
	        var entry = res.data[Object.keys(res.data)[i]];
	        var rosterid = this.state.rid;
			this.setState({curDataLoaded: rosterid})

	        if(entry.roster === rosterid) {
	        
		        var user = entry.user
		        var online = entry.online;
		        var tabbedIn = entry.tabbedin;
		        var editTimestamp = entry.editTimestamp;


		        var userStatus = ""

		        if(Date.now() - editTimestamp > 5000) {
		            userStatus = "[X] Not connected (Timed out) -- "
		            if(Date.now() - editTimestamp > 10000) {
		              userStatus = "[X] Not connected -- "
		            }
		        } else {
		            if(online) {
		              if(tabbedIn) {
		                userStatus = "[+] Ready -- "
		              } else {
		                userStatus = "[-] Tabbed out -- "
		              }
		            } else {
		              userStatus = "[X] Not connected -- "
		            }
		          }
		        text = text + userStatus + user.username + "\n";
	        
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

  	return (<div class="login-page">

	  <p class="TitleText">CopBot Web Dashboard / Roster / {this.state.rid}</p>
	  <input ref={this.inputRef} type="text" id="inputfield" placeholder="Roster name"></input>
	  <div class="form">
	  <NewlineText text={this.state.stateText} />
	  <Loader visible={!this.state.goodDataLoaded ? 1 : 0} />
	  </div>
	</div>);
  }
}




ReactDOM.render(<UserRoster rosterid="" />, document.getElementById('root'));
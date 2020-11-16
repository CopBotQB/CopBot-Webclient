import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';


const axios = require('axios')

class UserRoster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {stateText: "No state", rid: ""}
    this.inputRef = React.createRef();

  }

	componentDidMount() {
		var thisObject = this;
		setInterval(function(){ 
	  		thisObject.getOnlineState();
		}, 1000);
	}


	setNewRID = () => {
		document.getElementById('root')
		this.setState({stateText: this.state.stateText, rid: this.inputRef.current.value})
		console.log(this.inputRef.current)

	}

  getOnlineState = () => {
    axios.get('https://copbot-e0c62.firebaseio.com/.json')
    .then(res => {
      if(res.data != null) {
      	var text = "";
      	for(var i = 0; i < Object.keys(res.data).length; i++) {
	        var entry = res.data[Object.keys(res.data)[i]];
	        var rosterid = this.state.rid;


	        if(entry.roster === rosterid) {
	        
		        var user = entry.user
		        var online = entry.online;
		        var tabbedIn = entry.tabbedin;
		        var editTimestamp = entry.editTimestamp;


		        var userStatus = ""

		        if(Date.now() - editTimestamp > 5000) {
		            userStatus = "🔴 Not connected (Timed out) -- "
		            if(Date.now() - editTimestamp > 10000) {
		              userStatus = "🔴 Not connected -- "
		            }
		        } else {
		            if(online) {
		              if(tabbedIn) {
		                userStatus = "🟢 Ready -- "
		              } else {
		                userStatus = "🟡 Tabbed out -- "
		              }
		            } else {
		              userStatus = "🔴 Not connected -- "
		            }
		          }
		        text = userStatus + user.username + "\n";
	        
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
	  <p class="TitleText">CopBot Web Dashboard / Roster code {this.props.rosterid}</p>
	  <input ref={this.inputRef} type="text" id="inputfield" placeholder="Roster name"></input>
	  <input type="button" id="loginbutton" value="Apply" onClick={this.setNewRID}></input>
	  <div class="form">
	  	{this.state.stateText}
	  </div>
	</div>);
  }
}




ReactDOM.render(<UserRoster rosterid="" />, document.getElementById('root'));
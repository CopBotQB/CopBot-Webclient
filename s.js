const axios = require('axios')
const Discord = require('discord.js');
const client = new Discord.Client();

var onlineData = {};
var usersWithGeneratedTokens = [];


var TokenGenerator = require( 'token-generator' )({
        salt: 'aaugle-ialesl-93kkaf-992ahe-fabwuyfgawffb238fanwsdfgah3[ha]ga34fb',
        timestampMap: 'jeopakthrf', // 10 chars array for obfuscation proposes
});


var timeToEdit = 120000;

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
async function dbRequest(channel, messageToEdit, timeElapsed) {

  if(timeElapsed > 0) {
    await sleep(2000)
  }

  axios
    .get('https://copbot-e0c62.firebaseio.com/.json')
    .then(res => {
      if(res.data != null) {
        onlineData = res.data;

        var text = "";
        for(var i = 0; i < Object.keys(onlineData).length; i++) {
          var entryName = Object.keys(onlineData)[i];
          var userId = onlineData[entryName].userId;
          var online = onlineData[entryName].online;
          var tabbedIn = onlineData[entryName].tabbedin;
          var editTimestamp = onlineData[entryName].editTimestamp;


          var status = ""

          if(Date.now() - editTimestamp > 5000) {
            status = "🔴 **Not connected (Timed out)** -- "
            if(Date.now() - editTimestamp > 10000) {
              status = "🔴 **Not connected** -- "
            }
          } else {

            if(online) {
              if(tabbedIn) {
                status = "🟢 **Ready** -- "
              } else {
                status = "🟡 **Tabbed out** -- "
              }
            } else {
              status = "🔴 **Not connected** -- "
            }
          }

          if(typeof client.users.cache.get(userId) != "undefined") {
            text = text + status + client.users.cache.get(userId).username + "\n";
          } else {
            text = text + status + "UNCACHED USER [Type a message to be cached]" + "\n";
          }
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#0000ff')
        .setTitle('Status')
        .setDescription(text);

        if(timeElapsed > timeToEdit) {
          embed.setFooter("Update finished.");
          messageToEdit.edit(embed);
          return;
        }

        if(messageToEdit == null) {
          channel.send(embed).then(m => {
            dbRequest(channel, m, timeElapsed + 2000)
          })

        } else {
          messageToEdit.edit(embed).then(m => {
            dbRequest(channel, m, timeElapsed + 2000)
          })
        }
      }

    })
    .catch(error => {
      console.error(error)
    })
}

function genToken(user) {
  axios.get('https://copbot-e0c62.firebaseio.com/.json')
    .then(res => {
      var userHasToken = false;

      if(res.data) {
        for(var i = 0; i < Object.keys(res.data).length; i++) {
          var entry = res.data[Object.keys(res.data)[i]];
          if(entry.user.id === user.id) {
            userHasToken = true;
          }
        }
      }

      if(!userHasToken) {
        var newToken = TokenGenerator.generate();

        axios.patch('https://copbot-e0c62.firebaseio.com/.json', {
          [newToken]: {
            online: false,
            tabbedin: false,
            editTimestamp: Date.now(),
            user: {
              id: user.id,
              username: user.username
            },
            roster:""
          }
        })
        .then(function (response) {
          const embed = new Discord.MessageEmbed()
          .setColor('#0000ff')
          .setTitle('Token')
          .setDescription(newToken + "\n\nThis is the only token you will recieve. Do not share this token with anyone else.");
          user.send(embed)
        })
        .catch(function (error) {
          const embed = new Discord.MessageEmbed()
          .setColor('#ff0000')
          .setTitle('Token')
          .setDescription("There was an error generating your token. Please try again.");
          user.send(embed)
        });
      } else {
        user.send("You already have a token. Read above.")
      }
    

    })
    .catch(error => {
      console.error(error)
    })






}



client.on('ready', () => {
  console.log("Ready")
})

client.on('message', async msg => {


  const args = msg.content.trim().split(' ');
  const command = args.shift().toLowerCase();

  if(command === "?status") {
    dbRequest(msg.channel, null, 0);
  }

  if(command === "?token") {
    genToken(msg.author)
  }

  if(command === "?roster" || command === "?r") {
  axios
    .get('https://copbot-e0c62.firebaseio.com/.json')
    .then(res => {

      if(res.data) {
        for(var i = 0; i < Object.keys(res.data).length; i++) {
          var entry = res.data[Object.keys(res.data)[i]];
          if(entry.user.id === args[0]) {


            axios.patch('https://copbot-e0c62.firebaseio.com/' + Object.keys(res.data)[i] + '.json', {
              roster: args[1]
            })
            .then(function (response) {
              const embed = new Discord.MessageEmbed()
              .setColor('#0000ff')
              .setTitle('Roster')
              .setDescription("Added user id " + args[0] + " to roster " + args[1]);
              msg.channel.send(embed)
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
  }

})

client.login('Nzc3NjE3MTQ0NjQ4Njk1ODg4.X7GCZg.8Lh8MxFcjv9rqdbopUEgkv4uYto');
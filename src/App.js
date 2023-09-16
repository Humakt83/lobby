import React, {useState, useRef} from 'react';
import './App.css';

let socket;

function App() {

  const [messages, setMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const playerMe = useRef('');
  const [registered, setRegistered] = useState(false);
  const [isRoom, setRoom] = useState(false);
  const [playersInRoom, setPlayersInRoom] = useState([]);

  const addMessage = (message) => {
    messages.unshift(message);
    setMessages(messages);
  }

  const open = async () => {
    if (socket) {
      addMessage('Already connected');
      return;
    }
    
    let uri = "ws://" + process.env.REACT_APP_SERVER_HOST + window.location.pathname;
    uri = uri.substring(0, uri.lastIndexOf('/'));
    socket = await new WebSocket(uri);
    
    socket.onerror = function(error) {
      addMessage(`error ${error}`);
    };
    
    socket.onopen = function(event) {
      addMessage(`opened, Connected to ${event.currentTarget.url}`);
    };
    
    socket.onmessage = function(event) {
      console.log(event);
      let message = event.data
      try {
        message = JSON.parse(message);
      } catch(e) {
        console.log(e);
      }
      const msgType = message?.msgType;
      switch (msgType) {
        case 'playerList':
          setPlayers(Object.keys(message.content));
          break;
        case 'startgame':
          goToGame(message.content);
          break;
        case 'invite':
          goToRoom(message.content); 
          break;
        case 'text':
        default:
          addMessage(message?.content ? message.content : message);
          break;
      }
    };
    
    socket.onclose = function(event) {
        addMessage(`closed, Disconnected: ${event.code} ${event.reason}`);
        socket = null;
    };
  }

  const register = async () => {
    setRegistered(true);
    await open();
    const registerInner = () => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify({
          msgType: 'registerplayer',
          content: {
              playerName: playerMe.current
          }}));  
      } else {
        setTimeout(registerInner, 100);
      }
    }
    registerInner();
  }

  const chat = async () => {
    socket.send(JSON.stringify({
      msgType: 'text',
      content: chatMessage
    }))
    setChatMessage("");
  }

  const goToRoom = (players) => {
    setPlayersInRoom(players);
    setRoom(true);
  }

  const goToGame = (key) => {
    if (playerMe.current.length < 1) {
      console.log('Something went wrong');
      return;
    }
    window.open(`http://localhost:3001/gameId=${key}&player=${playerMe.current}`, '_blank');
  }

  const inviteToGameRoom = async (player) => {
    if (player !== playerMe.current) {
      const key = `gameroom-${Math.random() * new Date().getMilliseconds()}`
      setRoom(true);
      await socket.send(JSON.stringify({
        msgType: 'inviteroom',
        content: {
          players: [player, playerMe.current],
          key
        }
      }));
    }
  }

  const startGame = async (player) => {
    if (player !== playerMe.current) {
      const key = `game-${Math.random() * new Date().getMilliseconds()}`
      await socket.send(JSON.stringify({
        msgType: 'startgame',
        content: {
          players: [player, playerMe.current],
          key
        }
      }));
    }
  }

  return (
    <div className="App">
      <h1>Lobby</h1>
      {!registered && 
        <div>
          <input disabled={registered} type="text" id="playerName" placeholder="Player name" onChange={(event) => {
            if (!registered) {
              playerMe.current = event.target.value;
            }
          }}/>
          <button disabled={registered} type="button" id="registerPlayer" onClick={register}>Join</button>
        </div>
      }
      {registered && 
        <div>
          <input placeholder="Send message" type="text" onChange={(event) => setChatMessage(event.target.value)}/>
          <button disabled={chatMessage.length < 1} type="button" onClick={chat}>Send</button>
        </div>
      }
      <div className="content">
        <div className="players">
          {players.map((player, index) => {
            return (<p className="player" key={`player-${index}`} onClick={() => inviteToGameRoom(player)}>{player}</p>)
          })}
        </div>
        <div className="messages">
          {messages.map((message, index) => {
            return (
              <span className="message" key={`message-${index}`}>{message}</span>
            )
          })}
        </div>
      </div>
      {isRoom && 
        <div className="room">
          {playersInRoom.map((player, index) => {
            return (<p className="player" key={`player-${index}`}>{player}</p>)
          })}
        </div>}
    </div>
  );
}

export default App;

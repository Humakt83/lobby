import React, {useState, useEffect} from 'react';
import './App.css';

let socket;

function App() {

  const [messages, setMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerMe, setPlayerMe] = useState('');
  const [registered, setRegistered] = useState(false);

  const addMessage = (message) => {
    setMessages(messages.concat(message))
  }

  useEffect(() => {
    open();
  },[]);
  
  const open = () => {
    if (socket) {
      addMessage('Already connected');
      return;
    }
    
    let uri = "ws://" + process.env.REACT_APP_SERVER_HOST + window.location.pathname;
    uri = uri.substring(0, uri.lastIndexOf('/'));
    socket = new WebSocket(uri);
    
    socket.onerror = function(error) {
      addMessage(`error ${error}`);
    };
    
    socket.onopen = function(event) {
      addMessage(`opened, Connected to ${event.currentTarget.url}`);
      socket.send(JSON.stringify({ msgType: 'getplayers' }));
    };
    
    socket.onmessage = function(event) {
      const message = event.data
      try {
        const parsed = JSON.parse(message);
        const msgType = parsed?.msgType;
        switch (msgType) {
          case 'playerList':
              setPlayers(Object.keys(parsed.content));
              break;
          case 'startgame':
            goToGame(parsed.content);
            break;
          case 'text':
          default:
            addMessage(`received <<<  ${message}`);
            break;
        }
      } catch(e) {
        console.log(e);
        addMessage(`error with message <<< ${message}`)
      }
    };
    
    socket.onclose = function(event) {
        addMessage(`closed, Disconnected: ${event.code} ${event.reason}`);
        socket = null;
    };
  }

  const register = () => {
    setRegistered(true);
    socket.send(JSON.stringify({
      msgType: 'registerplayer',
      content: {
          playerName: playerMe
      }
    }));
  }

  const goToGame = (key) => {
    window.location.href = `http://${process.env.REACT_APP_GAME_HOST}/gameId=${key}&player=${playerMe}`;
  }

  const startGame = async (player) => {
    if (player !== playerMe) {
      const key = `game-${Math.random() * new Date().getMilliseconds()}`
      await socket.send(JSON.stringify({
        msgType: 'startgame',
        content: {
          players: [player, playerMe],
          key
        }
      }));
      goToGame(key);
    }
  }

  return (
    <div className="App">
      <h1>Lobby</h1>
      <div>
        <input disabled={registered} type="text" id="playerName" placeholder="Player name" onChange={(event) => setPlayerMe(event.target.value)}/>
        <button disabled={registered} type="button" id="registerPlayer" onClick={register}>Register</button>
      </div>
      <div className="players__container">
        {players.map((player, index) => {
          return (<p className="player" key={`player-${index}`} onClick={() => startGame(player)}>{player}</p>)
        })}
      </div>
      <div className="messages">
        {messages.map((message, index) => {
          return (
            <p className="message" key={`message-${index}`}>{message}</p>
          )
        })}
      </div>
    </div>
  );
}

export default App;

import React, {useState} from 'react';
import './App.css';

let socket;

function App() {

  const [messages, setMessages] = useState([]);

  const addMessage = (message) => {
    setMessages(messages.concat(message))
  }
  
  const open = () => {
    if (socket) {
      addMessage('Already connected');
      return;
    }
    
    let uri = "ws://" + window.location.host + window.location.pathname;
    uri = uri.substring(0, uri.lastIndexOf('/'));
    socket = new WebSocket(uri);
    
    socket.onerror = function(error) {
      addMessage(`error ${error}`);
    };
    
    socket.onopen = function(event) {
      addMessage(`opened, Connected to ${event.currentTarget.url}`);
    };
    
    socket.onmessage = function(event) {
        addMessage(`received <<<  ${event.data}`);
    };
    
    socket.onclose = function(event) {
        addMessage(`closed, Disconnected: ${event.code} ${event.reason}`);
        socket = null;
    };
  }

  const send = () => {
    if (!socket) {
      addMessage(`error Not connected`);
      return;
    }
    const text = document.getElementById("input").value;
    socket.send(text);
    addMessage(`sent >>>  ${text}`);
  }

  const close = () => {
    if (!socket) {
      addMessage(`error 'Not connected`);
      return;
    }
    socket.close(1000, 'Close button clicked');
  };

  return (
    <div className="App">
      <h1>WebSocket Demo</h1>
      <div>
        <input type="text" id="input" value="Enter text to reverse!" />
      </div>
      <div>
          <button type="button" id="open" onClick={open}>Open</button>
          <button type="button" id="send" onClick={send}>Send</button>
          <button type="button" id="close" onClick={close}>Close</button>
      </div>
      <div>
        {messages.map(message => {
          return (
            <p>{message}</p>
          )
        })}
      </div>
    </div>
  );
}

export default App;

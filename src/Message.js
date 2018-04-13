import React, {Component} from 'react'
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import {
    Card, CardImg, CardText, CardBody,
    CardTitle, CardSubtitle, Button
} from 'reactstrap';
import person from './person.svg'

export class Message extends Component {
  constructor(props) {
      super(props)
      this.state = { card: null, test: <br/> }
      this.urlify = this.urlify.bind(this)
    }

    urlify(text) {
        var urlRegex = /(https?:\/\/[^\s]+)/g
        return text.replace(urlRegex, '<a href="$1">$1</a>')
    }

    test(text) {
        var x = this.urlify(text);
        return x
    }
    
  render() {
    var message = this.props.message;
    var output;
      if (message.room === this.props.room || message.room === "#all") {
        console.log(message)
          // Nickname update
          const name = message.nickname ? message.nickname : "Anonymous"
      output =
          <div class="row no-gutters" key={message.id} style={{ fontSize: 12 }}>
            <div className="avatar-container">
              <img className="rounded avatar" src={message.img ? message.img : person} />
            </div>
            <div className="message-container">
              <div>
              <span style={{ color: message.color, fontSize: 14 }}>
                {name}
                <small style={{ marginLeft: 5}}>
                  <code>[{message.client}]</code>
                </small>
              </span>
              </div>
              <div style={{marginTop: 6}}>
                <span style={{ overflow: "auto", wordWrap: "break-word" }}>{message.data}</span>
              </div>
            </div>
       </div>
          return (
              <div style={{ padding: 10, borderBottom: "1px solid #eeeeee" }}>{output}</div>
      )
    } else {
      console.log("Message " + message.id + " is from a different channel");
      return null
    }
  }

}

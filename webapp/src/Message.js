import React, {Component} from 'react'
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import { getMetadata } from 'page-metadata-parser';
import {
    Card, CardImg, CardText, CardBody,
    CardTitle, CardSubtitle, Button
} from 'reactstrap';

export class Message extends Component {
  constructor(props) {
      super(props)
      this.state = { card: null }
      this.urlify = this.urlify.bind(this)
    }

    urlify(text) {
        var urlRegex = /(https?:\/\/[^\s]+)/g
        return text.replace(urlRegex, function (url) {
            /**
            console.log(url)
            const ogs = require('open-graph-scraper');
            const testurl = "https://crossorigin.me/" + url
            const options = { 'url': testurl };
            ogs(options, function (error, results) {
                this.setState({ card: results })
            }.bind(this));
            console.log(this.state.card)
            const x = '<Card><CardBody><CardTitle>'+""+'</CardTitle></CardBody></Card>'
            */
            var x = ''
            return '<a href="' + url + '">' + url + '</a><br/>'+x;
        }.bind(this))
        // or alternatively
        // return text.replace(urlRegex, '<a href="$1">$1</a>')
    }

    test(text) {
        var x = this.urlify(text);
        return ReactHtmlParser(x)
    }
  render() {
    var message = this.props.message;
    var output;
      if (message.room === this.props.room || message.room === "#all") {
          const abc = this.test(message.data)
          // Nickname update
          const name = message.nick ? message.nick : "Anonymous"
      output = <div key={message.id} style={{ fontSize: 12 }}>
            <span style={{ color: message.color }}>
                {name} <small>
                <code>[{message.client}]</code>
              </small>
          </span>: <span style={{ overflow: "auto", wordWrap: "break-word" }}>{abc}</span>
          </div>;
          return (
              <div style={{ padding: 10, borderBottom: "1px solid #eeeeee" }}>{output}</div>
      )
    } else {
      console.log("Message " + message.id + " is from a different channel");
      return null
    }
  }

}

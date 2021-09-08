/** @jsx Vact.createElement */
import Vact from "../Didact";
import Counter from "./Counter";

class App extends Vact.Component {
  constructor(props) {
    super(props);
  }

  state = {
    counterList: [1, 2, 3, 4, 5]
  };
  handleClick = () => {
    this.setState({
      count: this.state.count + 1
    });
  };

  render() {
    const {
      counterList
    } = this.state;
    return Vact.createElement("div", null, Vact.createElement("h1", null, "Counter List"), Vact.createElement("div", null, counterList.map(value => Vact.createElement(Counter, {
      value: value
    }))));
  }

}

Vact.render(<App/>, document.getElementById("root"));

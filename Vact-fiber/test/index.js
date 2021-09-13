/** @jsx Vact.createElement */

import Vact from "../index";
import Counter from "./Counter";

class App extends Vact.Component {
  constructor(props) {
    super(props);
  }
  state = {
    counterList: [1, 2, 3, 4, 5],
  };

  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    const { counterList } = this.state;
    return (
      <div>
        <h1>Counter List</h1>
        <div>
          {counterList.map((value) => (
            <Counter value={value} />
          ))}
        </div>
      </div>
    );
  }
}

Vact.render(<App/>, document.getElementById("root"));

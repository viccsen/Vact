/** @jsx Vact.createElement */

import Vact from "../index";

class Counter extends Vact.Component {
  constructor(props) {
    super(props);
  }
  state = {
    count: this.props.value,
  };

  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    const { count } = this.state;
    return (
      <div>
        <p>counter: {count}</p>
        <button onClick={this.handleClick}>+1</button>
      </div>
    );
  }
}

export default Counter;

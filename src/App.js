// Dependencies
import React, { Component } from "react";
import update from "react-addons-update";
import Sound from "react-sound";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
// API
import novelFrames from "./api/novelFrames";
import Choices from "./api/Choices";
// Components
import TitleScreen from "./components/TitleScreen";
import ChoiceMenu from "./components/ChoiceMenu";
import RenderFrame from "./components/RenderFrame";
import MenuButtons from "./components/MenuButtons";
import SaveAndLoadMenu from "./components/SaveAndLoadMenu";
// css
import "./App.css";
import "./TitleScreen.css";

// States that don't need to mount or rely on api data
const initialState = {
  testRoutesCompleted: false,
  choicesCount: {
    Sprinter: 0,
    Alternate: 0,
    Third: 0
  },
  index: 0,
  choicesExist: false,
  titleScreenShown: true,
  frameIsRendering: false,
  showMenu: true,
  backlogShown: false,
  textBoxShown: true,
  saveMenuShown: false,
  loadMenuShown: false,
  indexHistory: []
};

class App extends Component {
  constructor() {
    super(); //constructor init

    this.state = initialState;
  }

  setFrame(index) {
    // Makes sure the index is within the novelFrames array
    if (index >= novelFrames.length) {
      index = novelFrames.length - 1;
    } else if (index <= -1) {
      index = 0;
    }
    // Updates novelFrames with new index
    this.setState({
      index: index,
      text: novelFrames[index].text,
      bg: novelFrames[index].bg,
      bgm: novelFrames[index].bgm,
      choicesExist: novelFrames[index].choicesExist,
      sceneChange: novelFrames[index].sceneChange,
      speaker: novelFrames[index].speaker,
      sprite: novelFrames[index].sprite,
      voice: novelFrames[index].voice
    });
  }

  setChoiceNumber(choicesIndex) {
    this.setState({
      choicesIndex: choicesIndex,
      question: Choices[choicesIndex].question,
      choiceOptions: Choices[choicesIndex].choices
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // Update indexHistory if index changed
    if (prevState.index !== this.state.index) {
      this.setState({
        indexHistory: [...this.state.indexHistory, prevState.index]
      });
    }
  }

  setPreviousFrame() {
    const index = this.state.index - 1;
    this.setFrame(index);
  }

  setNextFrame() {
    // Resume to main route after testRoutes detour
    if (novelFrames[this.state.index].testRoutesCompleted) {
      this.setFrame(10);
    } else {
      this.setFrame(this.state.index + 1);
    }
  }

  renderFrame() {
    return (
      <RenderFrame
        setNextFrame={this.setNextFrame.bind(this)}
        bg={this.state.bg}
        sceneChange={this.state.sceneChange}
        sprite={this.state.sprite}
        speaker={this.state.speaker}
        text={this.state.text}
        textBoxShown={this.state.textBoxShown}
      />
    );
  }

  setNextChoice() {
    const choicesIndex = this.state.choicesIndex + 1;
    this.setState({
      choicesIndex: choicesIndex,
      choiceOptions: Choices[choicesIndex].choices
    });
  }

  setFrameFromChoice(choice) {
    const updatedChoicesCount = update(this.state.choicesCount, {
      [choice]: { $apply: currentValue => currentValue + 1 }
    });
    // Routes depending on choice
    if (updatedChoicesCount.Sprinter === 1) {
      this.setFrame(2);
    } else if (updatedChoicesCount.Alternate === 1) {
      this.setFrame(6);
    } else if (updatedChoicesCount.Third === 1) {
      this.setFrame(8);
    }
    this.setState({
      choicesCount: updatedChoicesCount
    });
  }

  handleChoiceSelected(event) {
    this.setFrameFromChoice(event.currentTarget.name);
    this.setNextChoice();
  }

  renderChoiceMenu() {
    return (
      <ChoiceMenu
        choiceOptions={this.state.choiceOptions}
        onChoiceSelected={this.handleChoiceSelected.bind(this)}
      />
    );
  }

  toggleMenu() {
    this.setState(prevState => ({
      showMenu: !prevState.showMenu
    }));
  }

  toggleBacklog() {
    if (this.state.saveMenuShown) {
      this.setState({ saveMenuShown: false });
    }
    if (this.state.loadMenuShown) {
      this.setState({ loadMenuShown: false });
    }
    this.setState(prevState => ({
      backlogShown: !prevState.backlogShown
    }));
  }

  toggleTextBox() {
    this.setState(prevState => ({
      textBoxShown: !prevState.textBoxShown
    }));
  }

  toggleSaveMenu() {
    if (this.state.loadMenuShown) {
      this.setState({ loadMenuShown: false });
    }
    if (this.state.backlogShown) {
      this.setState({ backlogShown: false });
    }
    this.setState(prevState => ({
      saveMenuShown: !prevState.saveMenuShown
    }));
  }

  toggleLoadMenu() {
    if (this.state.saveMenuShown) {
      this.setState({ saveMenuShown: false });
    }
    if (this.state.backlogShown) {
      this.setState({ backlogShown: false });
    }
    this.setState(prevState => ({
      loadMenuShown: !prevState.loadMenuShown
    }));
  }

  // Saves and sets current state to local storage
  saveSlot(number) {
    localStorage.setItem("time" + number, new Date().toString());
    localStorage.setItem(number, JSON.stringify(this.state));
    this.setState(JSON.parse(localStorage.getItem(number)));
  }

  // Loads and sets state from local storage
  loadSlot(number) {
    this.setState(JSON.parse(localStorage.getItem(number)));
    this.setState({
      saveMenuShown: false
    }); // save menu to false and not load because save is true when saving
  }

  beginStory() {
    this.setState({
      titleScreenShown: false,
      frameIsRendering: true
    });
    this.setFrame(0);
    this.setChoiceNumber(0);
  }

  titleScreen() {
    return (
      <TitleScreen
        beginStory={this.beginStory.bind(this)}
        toggleLoadMenu={this.toggleLoadMenu.bind(this)}
      />
    );
  }

  // Not menuButtons on bottom
  saveMenu() {
    return (
      <SaveAndLoadMenu
        currentTime={this.state.currentTime}
        menuType="Save Menu"
        executeSlot={this.saveSlot.bind(this)}
        toggleMenu={this.toggleSaveMenu.bind(this)}
      />
    );
  }

  // Not menuButtons on bottom
  loadMenu() {
    return (
      <SaveAndLoadMenu
        currentTime={this.state.currentTime}
        menuType="Load Menu"
        executeSlot={this.loadSlot.bind(this)}
        toggleMenu={this.toggleLoadMenu.bind(this)}
      />
    );
  }

  // Menu on bottom of screen
  renderMenuButtons() {
    // Shows menu buttons
    if (this.state.showMenu) {
      return (
        <MenuButtons
          toggleSaveMenu={this.toggleSaveMenu.bind(this)}
          toggleLoadMenu={this.toggleLoadMenu.bind(this)}
          saveSlot={this.saveSlot.bind(this)}
          loadSlot={this.loadSlot.bind(this)}
          saveMenuShown={this.state.saveMenuShown}
          loadMenuShown={this.state.loadMenuShown}
          toggleMenu={this.toggleMenu.bind(this)}
          toggleBacklog={this.toggleBacklog.bind(this)}
          toggleTextBox={this.toggleTextBox.bind(this)}
          textBoxShown={this.state.textBoxShown}
          backlogShown={this.state.backlogShown}
        />
      );
    } else {
      // Shows "Show Buttons" on hover
      return (
        <div className="menu-buttons hidden">
          <button onClick={this.toggleMenu.bind(this)}>Show Buttons</button>
        </div>
      );
    }
  }

  backlog() {
    let loggedText = [];
    for (var i = 0; i < this.state.indexHistory.length; i++) {
      loggedText.unshift(
        <div className="backlog" key={loggedText.toString()}>
          <div className="backlog-speaker">
            {novelFrames[this.state.indexHistory[i]].speaker}
          </div>
          {novelFrames[this.state.indexHistory[i]].text}
        </div>
      );
    }

    return <div className="overlay backlog-overlay">{loggedText}</div>;
  }
  playBGM() {
    return (
      <Sound
        url={this.state.bgm}
        playStatus={Sound.status.PLAYING}
        loop="true"
      />
    );
  }

  render() {
    return (
      <div className="container">
        <ReactCSSTransitionGroup
          component="div"
          transitionName="menu"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={300}
        >
          {this.state.titleScreenShown ? this.titleScreen() : null}
          {this.state.saveMenuShown ? this.saveMenu() : null}
          {this.state.loadMenuShown ? this.loadMenu() : null}
          {this.state.backlogShown ? this.backlog() : null}
          {this.state.frameIsRendering ? this.renderFrame() : null}
          {this.state.choicesExist ? this.renderChoiceMenu() : null}
          {!this.state.titleScreenShown ? this.renderMenuButtons() : null}
        </ReactCSSTransitionGroup>
        {this.playBGM()}
      </div>
    );
  }
}

export default App;

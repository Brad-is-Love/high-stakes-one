import React from "react";
//import discord from react-bootstrap-icons
import { Discord, Reddit } from "react-bootstrap-icons";
import { Logo } from "./Logo";

export class LandingPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
    };
  }

  componentDidMount() {
    this.calculateCountdown();
    this.interval = setInterval(this.calculateCountdown, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  calculateCountdown = () => {
    const endDate = new Date("2023-09-21").getTime();
    const now = new Date().getTime();
    const timeLeft = endDate - now;

    if (timeLeft <= 0) {
      clearInterval(this.interval);
      return;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const min = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const sec = Math.floor((timeLeft % (1000 * 60)) / 1000);

    this.setState({
      days,
      hours,
      min,
      sec,
    });
  };

  render() {
    return (
      <>
        <div className="background"></div>
          <div className="landing-page">
            <div className="container">
              <div className="row justify-content-center">
                <Logo />
              </div>
              <div className="row justify-content-center">
                <div className="col-11 col-md-8 text-center">
                  <p>
                    High Stakes is launching soon with{" "}
                    <strong>Sweepstakes</strong>, a staking lottery for Harmony
                    ONE. Players stake ONE together and a weekly winner scoops
                    the rewards.
                  </p>
                  <p>
                    Sign up and get rewarded for being part of the alpha
                    program.
                  </p>
                </div>
              </div>
              <div className="row justify-content-center pb-4">
                <a
                  href="https://forms.gle/uiGXjxDPgEkDSBfL8"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="btn-success btn-lg mt-3">
                    Sign up for early access
                  </button>
                </a>
              </div>
              <div className="row justify-content-center">
              <h4>Alpha version launching in</h4>
              </div>
              <div
                className="row text-center pt-1"
                style={{ maxWidth: "200px", margin: "0 auto" }}
              >
                <div className="col">
                  <h2>{this.state.days}</h2>
                  <h6>days</h6>
                </div>
                <div className="col">
                  <h2>{this.state.hours}</h2>
                  <h6>hours</h6>
                </div>
                <div className="col">
                  <h2>{this.state.min}</h2>
                  <h6>minutes</h6>
                </div>
                <div className="col">
                  <h2>{this.state.sec}</h2>
                  <h6>seconds</h6>
                </div>
              </div>
                <div className="row justify-content-center text-center pt-5 mt-3 pb-5 mb-3" style={{maxWidth: "200px", margin: "0 auto"}}>
                  <div className="col">
                    <a
                      href="https://discord.gg/pYXGSfZx"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Discord size={25} color="#eae8e8" />
                    </a>
                  </div>
                  {/* <div className="col">
                    <a
                      href="https://twitter.com/highstakesone"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter size={25} color="#eae8e8" />
                    </a>
                  </div> */}
                  <div className="col">
                    <a
                      href="https://www.reddit.com/r/high_stakes_life/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Reddit size={25} color="#eae8e8" />
                    </a>
                  </div>
                </div>
            </div>
       
        </div>
      </>
    );
  }
}

import React, { useEffect, useRef, useState } from 'react';
import giveRandomQuestion from '../../questions/giveRandomQuestion';
import FrontCounter from '../front-counter/FrontCounter';
import './question-container.css';

const QuestionContainer = ({ topic }: { topic: string }) => {
  document.onkeydown = (event) => {
    const answerOptions = document.querySelectorAll('.answer-option button');
    const key = Number(event.key);
    if (answerOptions[key - 1]) {
      answerOptions[key - 1].dispatchEvent(
        new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
        })
      );
    } else if (event.key === ' ') {
      document.querySelector('#next-button')?.dispatchEvent(
        new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
        })
      );
    }
  };

  const constantCounters = useRef([0, 0]);

  const [todayDate, setTodayDate] = useState(new Date().toDateString());
  const [showExplanation, setShowExplanation] = useState('none');
  const [[questionArray, optionsArray, additionToQuestion, explanation], setQuestion] = useState(
    giveRandomQuestion(0)
  );
  const [answerMode, setAnswerMode] = useState(false);
  const [counterOfCorrect, setCounterOfCorrect] = useState(0);
  const [counterOfAttempts, setCounterOfAttempts] = useState(0);
  const [rightRowCounter, setRightRowCounter] = useState(0);
  const [dataBlockNumber, setDataBlockNumber] = useState(0);

  useEffect(() => {
    setQuestion(giveRandomQuestion(dataBlockNumber));
    setCounterOfCorrect(0);
    setCounterOfAttempts(0);
    setRightRowCounter(0);
  }, [topic]);

  useEffect(() => {
    if (rightRowCounter % 5 === 0 && rightRowCounter !== 0) {
      setDataBlockNumber((dataBlockNumber) => dataBlockNumber + 1);
    }
  }, [rightRowCounter]);

  useEffect(() => {
    setTodayDate(new Date().toDateString());
  }, [topic, counterOfCorrect, counterOfAttempts]);

  useEffect(() => {
    let updateOnCorrect = 0;
    let updateOnAttempts = 0;
    if (counterOfCorrect > constantCounters.current[0]) {
      updateOnCorrect = 1;
      constantCounters.current[0] = counterOfCorrect;
    } else {
      updateOnCorrect = 0;
    }
    if (counterOfAttempts > constantCounters.current[1]) {
      updateOnAttempts = 1;
      constantCounters.current[1] = counterOfAttempts;
    } else {
      updateOnAttempts = 0;
    }

    const currentTopicStatistics = JSON.parse(localStorage.getItem(`statistics${topic}`) as string);
    if (currentTopicStatistics) {
      // write data into statistics by date
      const today = currentTopicStatistics.find(
        (date: object) => Object.keys(date)[0] === todayDate
      );

      const indexOfToday = currentTopicStatistics.findIndex(
        (date: object) => Object.keys(date)[0] === todayDate
      );

      if (today) {
        currentTopicStatistics[indexOfToday] = {
          [todayDate]: [
            today[todayDate][0] + updateOnCorrect,
            today[todayDate][1] + updateOnAttempts,
          ],
        };
        localStorage.setItem(`statistics${topic}`, JSON.stringify(currentTopicStatistics));
      } else {
        localStorage.setItem(
          `statistics${topic}`,
          JSON.stringify([
            ...currentTopicStatistics,
            { [todayDate]: [updateOnCorrect, updateOnAttempts] },
          ])
        );
      }
    } else {
      localStorage.setItem(
        `statistics${topic}`,
        JSON.stringify([{ [todayDate]: [updateOnCorrect, updateOnAttempts] }])
      );
    }
  }, [topic, counterOfCorrect, counterOfAttempts, todayDate]);

  const handleAnswerButtonClick = (event: React.MouseEvent, answer: string) => {
    event.preventDefault();

    const wrongQuestions = localStorage.getItem(`wrong ${topic} questions`);

    setCounterOfAttempts(counterOfAttempts + 1);
    if (localStorage.getItem(`total${topic}`)) {
      const kept = JSON.parse(localStorage.getItem(`total${topic}`) as string);

      localStorage.setItem(`total${topic}`, JSON.stringify([kept[0], kept[1] + 1]));
    } else {
      localStorage.setItem(`total${topic}`, JSON.stringify([counterOfCorrect, 1]));
    }

    setShowExplanation('block');
    if (!answer.includes('[x]')) {
      setRightRowCounter(0);
      event.currentTarget.setAttribute('style', 'background:rgb(255,100,0)');

      if (wrongQuestions) {
        localStorage.setItem(
          `wrong ${topic} questions`,
          JSON.stringify([...JSON.parse(wrongQuestions), questionArray[0]])
        );
      } else {
        localStorage.setItem(`wrong ${topic} questions`, JSON.stringify([questionArray[0]]));
      }
    } else {
      setRightRowCounter((rightRowCounter) => rightRowCounter + 1);
      if (wrongQuestions) {
        const wrongQuestionsFiltered = JSON.parse(wrongQuestions).filter(
          (question: string) => question !== questionArray[0]
        );
        localStorage.setItem(
          `wrong ${topic} questions`,
          JSON.stringify([...wrongQuestionsFiltered])
        );
      }

      setCounterOfCorrect(counterOfCorrect + 1);

      const kept = JSON.parse(localStorage.getItem(`total${topic}`) as string);

      localStorage.setItem(`total${topic}`, JSON.stringify([kept[0] + 1, kept[1]]));
    }
    setAnswerMode(true);
  };
  const handleNextButtonClick = () => {
    setQuestion(giveRandomQuestion(dataBlockNumber));
    setAnswerMode(false);
    setShowExplanation('none');
  };
  return (
    <div id="question-container">
      <FrontCounter
        counterOfCorrect={counterOfCorrect}
        counterOfAttempts={counterOfAttempts}
        topic={topic}
      />
      <div id="question" key="quesion">
        {questionArray[0]}
      </div>
      <div id="addition-to-question" key="addition">
        {additionToQuestion.map((addition: string, index: number) => (
          <div key={`${addition}${index}`}>
            {addition.split('\n').map((line, index) => (
              <div key={`${line}${index}`}>{line}</div>
            ))}
          </div>
        ))}
      </div>
      <div id="answers" key="answers">
        <ol>
          {optionsArray?.length &&
            optionsArray.map((answer: string, index: number) => (
              <li className="answer-option" key={`${answer}${index}`}>
                <button
                  onClick={(event: React.MouseEvent) => handleAnswerButtonClick(event, answer)}
                  style={{
                    background: answerMode && answer.includes('[x]') ? 'lightgreen' : '',
                  }}
                >
                  {answer.slice(answer.indexOf(']') + 1)}
                </button>
              </li>
            ))}
        </ol>
      </div>
      <div id="explanation" style={{ display: showExplanation }} key="explanation">
        {explanation.map((element: string, index: number) => (
          <div key={`${element}${index}`}>{element}</div>
        ))}
      </div>
      <div style={{ display: showExplanation }} key="button">
        <button id="next-button" onClick={handleNextButtonClick}>
          Next=&gt;
        </button>
      </div>
    </div>
  );
};

export default QuestionContainer;

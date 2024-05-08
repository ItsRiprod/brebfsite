import { useState, useEffect } from "react";
import "./App.css";
import breadImage from "/bread.svg"; // Import bread.svg
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, onValue, off, get, set, increment } from "firebase/database";

const firebaseConfig = {
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig); // Initialize Firebase app outside the component
const database = getDatabase(app);

function MouseCounter({ counterPosition, totalCount }) {
  return (
    <div className="counter" style={{ left: counterPosition.x + 5, top: counterPosition.y - 15 }}>
      {totalCount.toLocaleString()}
    </div>
  );
}

function BreadLayer({ breadImages, breadCoordinates, totalCount, dbBreadCoordinates, randomBread, setRandomBread, breadAmount, clientId}) {


  const renderBread = (coordinate, index) => {
    if (coordinate == null) {
      return null;
    }
  
    coordinate.fade = false;
    if (coordinate.id != clientId) {
      coordinate.fade = true;
    }
   

    if ((coordinate.num - totalCount) + breadAmount + 100 > 0) {
      const type = (randomBread != -2) ? (coordinate.type != null) ? breadImages[coordinate.type] : breadImage : breadImage;

      return (
      <img
      draggable="false"
      key={index}
      className={(coordinate.fade ? " fade " : "") + coordinate.parent + " background"}
        src={type}
        alt={breadImage}
        style={{
          position: 'absolute',
          left: coordinate.x,
          top: coordinate.y,
          opacity: Math.max(0.01 * ((coordinate.num - totalCount) + breadAmount), 0)
        }}
        />
      );
    }
    return null;
  
    };


    
    
    //const dbBreadElements = () => Object.values(dbBreadCoordinates).filter((old) => old.id != clientId).map(renderBread);
    //const breadElements = () => Object.values(breadCoordinates).map(renderBread);

  return (
    <>
    <div>
      {Object.values(dbBreadCoordinates).filter((old) => old.id !== clientId).map(renderBread)}
      {breadCoordinates.map(renderBread)}
    </div>
    </>
  );
}

function BreadText({ totalCount, milestone }) {
  const [newMilestone, setNewMilestone] = useState(0);
  const [milestoneChanged, setMilestoneChanged] = useState(false);

  useEffect(() => {
    // Set milestoneChanged to true when milestone changes
    if (milestone !== newMilestone) {
      if (newMilestone == -1)
        setNewMilestone(milestone);
      setMilestoneChanged(true);
    }

    // After a delay, update newMilestone to milestone and reset milestoneChanged
    const timerId = setTimeout(() => {
      setNewMilestone(milestone);
      setMilestoneChanged(false);
    }, 1000); // Delay of 2000 milliseconds (2 seconds)

    return () => clearTimeout(timerId);
  }, [milestone, newMilestone]);

  return (
    <>
      <h1 style={{ pointerEvents: "none", userSelect: "none" }}>Bread {totalCount.toLocaleString()}</h1>
      <h2 className={milestoneChanged ? "milestone milestone-changed" : "milestone " }>Next Goal: {newMilestone.toLocaleString()}</h2>
    </>
  );
}
/**
 * The widget of widgets
 * @param {*} param0 
 * @returns 
 */
function Widget({ dbAccounts, accounts, cps, count, milestone, totalCount, breadImages, randomBread, setRandomBread }) {
  const [leaderboard, setLeaderboard] = useState([
    {
      img: breadImages[0],
      score: 0
    },
    {
      img: breadImages[0],
      score: 0
    },
    {
      img: breadImages[0],
      score: 0
    }
  ]);
  const [lastCount, setLastCount] = useState(0);
 
  
  useEffect(() => {
    // Get Leaderboard
    const newLeaderboard = [...leaderboard];
  
    for (const i in dbAccounts) {
      const score = (dbAccounts[i].score + (accounts[i] ? accounts[i].score : 0));
  
      if (score >= newLeaderboard[0].score) {
        newLeaderboard[0] = { img: breadImages[i], score };
      } else if (score >= newLeaderboard[1].score) {
        newLeaderboard[1] = { img: breadImages[i], score };
      } else if (score >= newLeaderboard[2].score) {
        newLeaderboard[2] = { img: breadImages[i], score };
      }
    }
  
    setLeaderboard(newLeaderboard);
  }, [dbAccounts, accounts, breadImages]);

  



  const handleThumbnailClick = (index) => {
    setRandomBread(index);
  };


  return (<>
    <div id="helper" /*style={{ top: `${top}px`, left: `${left}px` }}*/>
      <div className="helper-inner">

        <div className="bottom">
          <div className="leaderboard">
            {leaderboard != null ? leaderboard.map((item, index) => (
              <div key={index} className="leaderboard-item">
                <img className="lbImage" src={randomBread != -2 ? item.img : breadImage} /> <p>Score: {item.score}</p>
              </div>
            )) : <div className="leaderboard-item">Leaderboard and stuff</div>}

          </div>
        </div>
        <div className="top">
          <div className="stat-item">Next Milestone {milestone}</div>
          <div className="stat-item">You: {count}</div>
          <div className="stat-item">Total: {totalCount}</div>
        </div>
        <button
          className="main"
          id="settingsButton"
          aria-label="Drag"
        >
          Menu {cps}
        </button>
      </div>
      <section id="settings">
            <div style={{width: "100%", paddingTop: "10px"}}>
              <button onClick={() => handleThumbnailClick(-1)}>Random</button>
              <button onClick={() => handleThumbnailClick(-2)}>Simple</button>
            </div>
          
            {dbAccounts.map((bread, index) => (
              <div key={index} className="thumbnail-container">
                <img className="thumbnail" src={breadImages[index]} alt={breadImages[index]} onClick={() => handleThumbnailClick(index)} />
                <div>
                  <p>Score: {bread.score}</p>
                  <p>Milestone: {bread.milestone}</p>
                </div>
              </div>
            ))}        
      </section>
    </div>
  </>
  );
}
/*
* Main Application
*/
function MainApp() {
  const [milestone, setMilestone] = useState(-1);
  const [breadCoordinates, setBreadCoordinates] = useState([]);
  const [displayCounter, setDisplayCounter] = useState(0);
  const [dbBreadCoordinates, setDbBreadCoordinates] = useState([]);
  const [breadCounter, setBreadCounter] = useState(0);
  const [sessionCounter, setSessionCounter] = useState(0);
  const [dbCounter, setDbCounter] = useState(0);
  const [counterPosition, setCounterPosition] = useState({ x: 0, y: 0 });
  const [randomBread, setRandomBread] = useState(-2);
  const [clientId, setClientid] = useState(Math.floor(Math.random() * 10000));
  const [startTime, setStartTime] = useState(Date.now());
  const [clicks, setClicks] = useState(1);
  const [cps, setCps] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [dbAccounts, setDbAccounts] = useState([]);

  const breadAmount = 1000;
  const [breadImages, setBreadImages] = useState([]);


  
  
  useEffect(() => {
    // Function to import bread images dynamically
    const importBreadImages = async () => {
      const images = [];
      for (let i = 1; i <= 110; i++) {
        // Dynamically import each bread image
        const { default: breadImage } = await import(`./assets/images/${i}.png`);
        images.push(breadImage);
      }
      // Set the array of imported bread images
      setBreadImages(images);
      setRandomBread(-1);
    };

    // Call the function to import bread images
    importBreadImages();
  }, []);

  useEffect(() => {

    const addBreadCoordinates = (clientX, clientY, num, randomType) => {
      const newCoordinates = { x: Math.round((clientX + window.scrollX) / 5) * 5,  y: Math.round((clientY + window.scrollY) / 5) * 5, type: randomType, num: num, id: clientId };
      // Check if the new coordinates already exist in the breadCoordinates
      if (!breadCoordinates.some(coord => coord.x === newCoordinates.x && coord.y === newCoordinates.y)) {
        // Add the new coordinates to the filtered array
        setBreadCoordinates((oldBread) => [...oldBread, newCoordinates]);  
      }
    };

    const handleClick =  (event) => {
      const { clientX, clientY } = event;
      const randomType = (randomBread == -1 || randomBread == -2) ? Math.floor(Math.random() * 109) + 1 : randomBread;

      
      setClicks(prevCount => prevCount + 1);
      setBreadCounter(prevCounter => prevCounter + 1);
      addBreadCoordinates(clientX, clientY, breadCounter + dbCounter, randomType);
      setSessionCounter(prevCounter => prevCounter + 1);
      setDisplayCounter(prevCount => prevCount + 1);
      
      if (accounts[randomType] != null) {
         setAccounts((prevAccounts) => ({
              ...prevAccounts,
              [randomType]: {
                ...prevAccounts[randomType],
                score: (prevAccounts[randomType]?.score || 0) + 1,
              },
            }));
      } else {
         setAccounts((prevAccounts) => ({
          ...prevAccounts,
          [randomType]: {
            score: 1,
            milestones: 0
          },
        }));
      }
      
      const newCps = (clicks / ((Date.now() - startTime) / 1265)).toFixed(2)
       setCps(newCps);
      
    };

    

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [accounts, breadCoordinates, breadCounter, clicks, clientId, dbCounter, randomBread, startTime]);

  useEffect(() => {
    
    const updateBreadMilestoneInDatabase = (count) => {
      const breadRef = ref(database, '/');
      update(breadRef, { milestonebread: count });
    };

    const updateBreadLocationsInDatabase = (coordinates, dbcoordinates) => {
      const coordinatesRef = ref(database, `/`);
      const updates = {}
      
      if (Object.keys(dbcoordinates).length > breadAmount + 200) {
        for(var key in dbcoordinates) {
          
          const bread = dbcoordinates[key];
          if (bread.num < displayCounter - breadAmount) {
            updates[`/coordinates/${key}`] = null;
          }
        }
        setBreadCoordinates((breadCoordinates) => breadCoordinates.filter(coord => coord.num >= displayCounter - breadAmount));
      }
      coordinates.map(coord => {
        if (coord.num >= displayCounter - breadAmount) {
          updates[`/coordinates/${coord.num+"-"+clientId}`] = {num: coord.num, x: coord.x, y: coord.y, type: coord.type, id: coord.id};
        }
      });

      update(coordinatesRef, updates ).then(() => {});
    };

    const updateBreadCounterInDatabase = (count) => {
        const breadRef = ref(database, '/');
        
        const updates = {};
        updates[`/bread`] = increment(breadCounter);
        for (var i in accounts) {
          if (accounts[i] != null) {
            updates[`/accounts/${i}/score`] = increment(accounts[i].score || 0);
            updates[`/accounts/${i}/milestone`] = increment(accounts[i].milestones || 0);
          }
        }
        
        update(breadRef, updates);
        setBreadCounter(0);
        setAccounts({});

    };

    const timeoutId = setTimeout(() => {
      if (breadCounter > 0 && displayCounter > 1000) {
        updateBreadLocationsInDatabase(breadCoordinates, dbBreadCoordinates);
        
        updateBreadCounterInDatabase(breadCounter);
   
      }

      setCps(0);
      setClicks(0);
      setStartTime(Date.now());
      console.log("Interval");
    }, 400);

    if (breadCounter + dbCounter >= milestone && dbCounter > 500) {
      if (milestone < 0) {
        const milestoneRef = ref(database, '/milestonebread');
        get(milestoneRef).then((snapshot) => {
          const milestoneValue = snapshot.val();
          if (milestoneValue) {
            setMilestone(milestoneValue);
          }
        });
      } else {
        const newMilestone = Math.floor(Math.random() * 2000) + milestone;
        setMilestone(newMilestone);
        updateBreadMilestoneInDatabase(newMilestone);
        
        updateBreadCounterInDatabase(breadCounter);
     
      }
    }

    if (breadCounter > sessionCounter/15 && dbCounter > 500) {
        updateBreadLocationsInDatabase(breadCoordinates, dbBreadCoordinates);
        
        updateBreadCounterInDatabase(breadCounter);
      
    }


    return () => {
      clearTimeout(timeoutId);
    };
  }, [accounts, breadCoordinates, breadCounter, clientId, dbBreadCoordinates, dbCounter, displayCounter, milestone, sessionCounter]);

  useEffect(() => {
    const breadRef = ref(database, '/bread');
    const milestoneRef = ref(database, '/milestonebread');
    const coordRef = ref(database, '/coordinates');
    const accountRef = ref(database, '/accounts');
    const unsubscribeBread = onValue(breadRef, (snapshot) => {
      setDbCounter(snapshot.val());
    });
    const unsubscribeMilestone = onValue(milestoneRef, (snapshot) => {
      setMilestone(snapshot.val());
    });
    const unsubscribeCoords = onValue(coordRef, (snapshot) => {
      setDbBreadCoordinates(snapshot.val());
    });
    const unsubscribeAccounts = onValue(accountRef, (snapshot) => {
      setDbAccounts(snapshot.val());
    });

    return () => {
      off(breadRef, 'value', unsubscribeBread);
      off(milestoneRef, 'value', unsubscribeMilestone);
      off(coordRef, 'value', unsubscribeCoords);
      off(accountRef, 'value', unsubscribeAccounts);
    };
  }, []);
  
  useEffect(() => {
   
    const intervalId = setInterval(() => {
      if (displayCounter < (dbCounter) && displayCounter != 0) {

        const temp = (breadCounter + dbCounter);
        
        const step = Math.ceil((temp-displayCounter) / 10); // Define a step for gradual increase
       
        setDisplayCounter(prevCounter => prevCounter + step); // Call the function once immediately
      } else if (displayCounter == 0 && dbCounter != 0) {
        setDisplayCounter(dbCounter - 100);
      } else {
        clearInterval(intervalId);
      }
      
    }, 80); // Adjust the interval as needed
  
    return () => {
      clearInterval(intervalId);
    };
  }, [displayCounter,  dbCounter]);

  return (
    <>
      <Widget accounts={accounts} dbAccounts={dbAccounts} cps={cps} breadImages={breadImages} randomBread={randomBread} setRandomBread={setRandomBread} count={sessionCounter} milestone={milestone} totalCount={displayCounter}/>
      <MouseCounter counterPosition={counterPosition} totalCount={displayCounter} />
      <BreadText totalCount={displayCounter} milestone={milestone} />
      <BreadLayer breadImages={breadImages} clientId={clientId} breadAmount={breadAmount} setRandomBread={setRandomBread} randomBread={randomBread} breadCoordinates={breadCoordinates} dbBreadCoordinates={dbBreadCoordinates} totalCount={breadCounter + dbCounter} />
    </>
  );
}


export default MainApp;

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
        className={(coordinate.fade ? " fade " : "") + coordinate.parent + " background"}
        key={index}
        src={type}
        alt={breadImage}
        style={{
          position: 'absolute',
          left: coordinate.x,
          top: coordinate.y,
          opacity: Math.max(0.01 * ((coordinate.num - totalCount) + breadAmount), 0)
        }}
        draggable="false"
        />)
      } else {
        return null;
      }
    }


    
    
    const dbBreadElements = () => Object.values(dbBreadCoordinates).filter((old) => old.id != clientId).map(renderBread);
    const breadElements = () => Object.values(breadCoordinates).map(renderBread);
    

  return (
    <>
      {dbBreadElements()}
      {breadElements()}
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
function Widget({ count, milestone, totalCount, breadImages, randomBread, setRandomBread }) {
  const [leaderboard, setLeaderboard] = useState([-1,-1,-1]);
  const [lastCount, setLastCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [top, setTop] = useState(50);
  const [left, setLeft] = useState(50);
  const [isClicked, setIsClicked] = useState(false);
  
  
  useEffect(() => {


    const handleMove = (event) => {
      if (isDragging) {
        event.preventDefault(); // Prevent default scroll behavior
        const { clientX, clientY } = event.type.includes('touch') ? event.touches[0] : event;
        setTop(clientY - offsetY);
        setLeft(clientX - offsetX);
      }
    };
    const dblclick = (event) => {
      setIsClicked((before) => !before);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };
    const element = document.getElementById('helper');
    element.addEventListener('dblclick', dblclick);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

  

    return () => {
      element.removeEventListener('dblclick', dblclick);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
    
    
  }, [isDragging, offsetX, offsetY]);

  useEffect(() => {
    
    const updateLeaderboardInDatabase = (lb, index) => {
      if (lb.length > 2) {
        const leaderboardRef = ref(database, `/leaderboard/${index}`);
        set(leaderboardRef, lb); // Assuming 'lb' is the entire leaderboard array
      }
    };
    
    const intervalId = setInterval(() => {
      if (count > lastCount) {

        // Check if count is greater than any value in leaderboard
        let indexToUpdate = -1;
        leaderboard.forEach((value, index) => {
          if (count > value && indexToUpdate == -1) {
            indexToUpdate = index;
          }
        });
        
        // Update leaderboard if count passes any position
        if (indexToUpdate !== -1) {
          updateLeaderboardInDatabase(count, indexToUpdate);
        }
        setLastCount(count);
      }
    }, 100);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [count, lastCount]);
  
  const handleStart = (event) => {
    setIsDragging(true);
    const { clientX, clientY } = event.type.includes('touch') ? event.touches[0] : event;
    const helperRect = document.getElementById('helper').getBoundingClientRect();
    setOffsetX(clientX - helperRect.left);
    setOffsetY(clientY - helperRect.top);
  };


  useEffect(() => {
    const leaderboardRef = ref(database, '/leaderboard');
    const unsubscribeBread = onValue(leaderboardRef, (snapshot) => {
      setLeaderboard(snapshot.val());
    });

    return () => {
      off(leaderboardRef, 'value', unsubscribeBread);
    };
  }, []);

  const handleThumbnailClick = (index) => {
    setRandomBread(index);
  };

  return (<>
    <div id="helper" style={{ top: `${top}px`, left: `${left}px` }}>
      <div className="bottom">
        <div className="leaderboard">
          {leaderboard.map((position, index) => (
            <div key={index} className="leaderboard-item">
              {index}: Score: {position}
            </div>
          ))}
          
        </div>
      </div>
      <button
        className="main"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        aria-label="Drag"
      >
        {isClicked? 'Close' : 'Options'}
      </button>
      <div className="top">
        Milestone {milestone}
        <div className="leaderboard-item">You: {count}</div>
        <div className="leaderboard-item">Total: {totalCount}</div>
      </div>
    </div>
    <section style={{ top: `${top + 103}px`, left: `${left}px` }} id="settings" className={(isClicked ? "" : "hidden")}>
          <div>
            <button onClick={() => handleThumbnailClick(-1)}>Random</button>
            <button onClick={() => handleThumbnailClick(-2)}>Simple</button>
          </div>
          <div>
          {breadImages.map((img, index) => (
            <div key={index} className="thumbnail-container">
              <img className="thumbnail" src={img} alt="bread" />
              <button onClick={() => handleThumbnailClick(index)}>{index}</button>
            </div>
          ))}

          </div>
    </section>
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

    const addBreadCoordinates = (clientX, clientY, num) => {
      const randomType = (randomBread == -1 || randomBread == -2) ? Math.floor(Math.random() * 109) + 1 : randomBread;
      const newCoordinates = { x: Math.round((clientX + window.scrollX) / 5) * 5,  y: Math.round((clientY + window.scrollY) / 5) * 5, type: randomType, num: num, id: clientId };
      // Check if the new coordinates already exist in the breadCoordinates
      if (!breadCoordinates.some(coord => coord.x === newCoordinates.x && coord.y === newCoordinates.y)) {
        // Add the new coordinates to the filtered array
        setBreadCoordinates((oldBread) => [...oldBread, newCoordinates]);  
      }
    };

    const handleClick = (event) => {
      const { clientX, clientY } = event;
      setBreadCounter(prevCounter => prevCounter + 1);
      addBreadCoordinates(clientX, clientY, breadCounter + dbCounter);
      setSessionCounter(prevCounter => prevCounter + 1);
      setDisplayCounter(prevCount => prevCount + 1);
    };

    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      setCounterPosition({ x: clientX + window.scrollX, y: clientY + window.scrollY });
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [sessionCounter, randomBread]);

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
        updates[`/bread`] = increment(count);
        update(breadRef, updates);

    };

    const intervalId = setInterval(() => {
      if (breadCounter > 0 && displayCounter > 1000) {
        updateBreadLocationsInDatabase(breadCoordinates, dbBreadCoordinates);
        
        updateBreadCounterInDatabase(breadCounter);
        setBreadCounter(0);
      }
    }, 350);

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
        setBreadCounter(0);
      }
    }

    if (breadCounter > sessionCounter/15 && dbCounter > 500) {
        updateBreadLocationsInDatabase(breadCoordinates, dbBreadCoordinates);
        
        updateBreadCounterInDatabase(breadCounter);
        setBreadCounter(0);
    }


    return () => {
      clearInterval(intervalId);
    };
  }, [breadCounter, dbCounter, milestone]);

  useEffect(() => {
    const breadRef = ref(database, '/bread');
    const milestoneRef = ref(database, '/milestonebread');
    const coordRef = ref(database, '/coordinates');
    const unsubscribeBread = onValue(breadRef, (snapshot) => {
      setDbCounter(snapshot.val());
    });
    const unsubscribeMilestone = onValue(milestoneRef, (snapshot) => {
      setMilestone(snapshot.val());
    });
    const unsubscribeCoords = onValue(coordRef, (snapshot) => {
      setDbBreadCoordinates(snapshot.val());
    });

    return () => {
      off(breadRef, 'value', unsubscribeBread);
      off(milestoneRef, 'value', unsubscribeMilestone);
      off(coordRef, 'value', unsubscribeCoords);
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (displayCounter < (dbCounter) && displayCounter != 0) {

        const temp = (breadCounter + dbCounter);
        
        const step = Math.ceil((temp-displayCounter) / 10); // Define a step for gradual increase
        
        const updateBreadCounter = () => {
          if (displayCounter < temp) {
            setDisplayCounter(prevCounter => prevCounter + step);
          } else {
            clearInterval(intervalId); // Clear interval once reached or exceeded the target
          }
        };

        updateBreadCounter(); // Call the function once immediately
      } else if (displayCounter == 0 && dbCounter != 0) {
        setDisplayCounter(dbCounter);
      }
    }, 100); // Adjust the interval as needed
  
    return () => {
      clearInterval(intervalId);
    };
  }, [displayCounter,  dbCounter]);

  return (
    <>
      <Widget breadImages={breadImages} randomBread={randomBread} setRandomBread={setRandomBread} count={sessionCounter} milestone={milestone} totalCount={displayCounter}/>
      <MouseCounter counterPosition={counterPosition} totalCount={displayCounter} />
      <BreadText totalCount={displayCounter} milestone={milestone} />
      <BreadLayer breadImages={breadImages} clientId={clientId} breadAmount={breadAmount} setRandomBread={setRandomBread} randomBread={randomBread} breadCoordinates={breadCoordinates} dbBreadCoordinates={dbBreadCoordinates} totalCount={breadCounter + dbCounter} />
    </>
  );
}


export default MainApp;

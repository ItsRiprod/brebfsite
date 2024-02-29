import { useState, useEffect, useRef, createRef  } from "react";
import "./App.css";
import breadImage from "/bread.svg"; // Import bread.svg

function MainApp() {
  const [breadCoordinates, setBreadCoordinates] = useState([]); // State to store bread coordinates
  const [breadCounter, setBreadCounter] = useState(0);
  const [counterPosition, setCounterPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClick = (event) => {
      const { clientX, clientY } = event;
      setBreadCoordinates(prevCoordinates => [...prevCoordinates, { x: clientX, y: clientY }]);
      setBreadCounter(breadCounter + 1)
    };

    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      setCounterPosition({ x: clientX, y: clientY });
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [breadCounter]); // Empty dependency array to run the effect only once

  return (
    <>
      <div className="counter" style={{ left: counterPosition.x + 5, top: counterPosition.y - 15 }}>{breadCounter}</div>
      <h1 style={{ pointerEvents: "none", 
  userSelect: "none" }}>Bread {breadCounter}</h1>
      {/* Render bread images */}
      {breadCoordinates.map((coordinate, index) => (
        <img
          key={index}
          src={breadImage}
          alt="bread"
          style={{
            position: "absolute",
            left: coordinate.x,
            top: coordinate.y
          }}
          draggable="false"
        />
      ))}
    </>
  );
}

export default MainApp;

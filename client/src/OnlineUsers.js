import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

function OnlineUsers() {
  const { state } = useLocation();
  const socket = io("http://localhost:8011/");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedMonth, setSelecteMonth] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [filterTrue, setFilterTrue] = useState(false);

  const handleFilterChange = async (month, isCheckedCheckBox) => {
    let payload = {
      month: month,
      onlyOnlineMembers: isCheckedCheckBox,
    };
    try {
      const response = await axios.post(
        "http://localhost:8011/filter",
        payload
      );
      if (response.data.success) {
        setOnlineUsers(response.data.user);
      }
    } catch (error) {
      console.error("Login failed:", error.message);
    }
    setFilterTrue((prev) => !prev);
  };
  useEffect(() => {
    const userOnline = state?.userOnline;
    if (userOnline) {
      socket.emit("setUserId", userOnline);
    }
    socket.on("updateOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
    //eslint-disable-next-line
  }, [state?.userOnline]);

  return (
    <div>
      <h2>Online Users</h2>
      <span>Filter :</span>&nbsp;
      <span>
        Select Month&nbsp;
        <select
          value={selectedMonth}
          onChange={(event) => setSelecteMonth(event.target.value)}
        >
          <option value="">All</option>
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </span>
      <span>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => setIsChecked((prev) => !prev)}
        />
        Show only Online Members
      </span>
      &nbsp;
      {!filterTrue ? (
        <button onClick={() => handleFilterChange(selectedMonth, isChecked)}>
          Apply Filter
        </button>
      ) : (
        <button onClick={() => handleFilterChange(0, false)}>
          Remove Filter
        </button>
      )}
      <ul>
        {onlineUsers.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  );
}

export default OnlineUsers;

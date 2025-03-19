import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import "../Styles/admin.css";

const Admin = () => {
  const [hirers, setHirers] = useState([]);

  useEffect(() => {
    const fetchHirers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const hirerData = await Promise.all(
          querySnapshot.docs
            .filter((doc) => doc.data().role === "hirer")
            .map(async (docSnap) => {
              const data = docSnap.data();

              // Fetch jobs associated with this hirer
              const jobsRef = collection(db, "jobs");
              const jobsSnapshot = await getDocs(jobsRef);
              const jobList = jobsSnapshot.docs
                .filter((jobDoc) => jobDoc.data().hirerId === docSnap.id)
                .map((jobDoc) => ({
                  id: jobDoc.id,
                  position: jobDoc.data().position,
                  reports: jobDoc.data().reports || 0,
                  likes: jobDoc.data().likes || 0,
                }));

              return {
                id: docSnap.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                totalLikes: data.totalLikes || 0,
                totalReports: data.totalReports || 0,
                jobList,
              };
            })
        );

        setHirers(hirerData);
      } catch (error) {
        console.error("Error fetching hirers:", error);
      }
    };

    fetchHirers();
  }, []);

  return (
    <div className="admin-container">
      <h1>Account Activity Reports</h1>

      {hirers.map((hirer) => (
        <div
          key={hirer.id}
          className="hirer-card"
          style={{
            borderColor: hirer.totalLikes >= 5 ? "green" : hirer.totalReports >= 3 ? "red" : "gray",
            borderWidth: "3px",
            borderStyle: "solid",
          }}
        >
          <h3>{hirer.firstName} {hirer.lastName}</h3>
          <p>Email: {hirer.email}</p>
          <p>Total Likes: {hirer.totalLikes || 0} 👍</p>
          <p>Total Reports: {hirer.totalReports || 0} 🚩</p>

          <h4>📌 Jobs Posted:</h4>
          {hirer.jobList.length > 0 ? (
            <ul>
              {hirer.jobList.map((job) => (
                <li key={job.id}>
                  {job.position} - {job.likes} 👍 | {job.reports} 🚩
                </li>
              ))}
            </ul>
          ) : (
            <p>No jobs posted.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default Admin;

import React, { useState, useEffect } from 'react';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [riotID, setRiotID] = useState("");
  const [matchHistory, setMatchHistory] = useState({});
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [version, setVersion] = useState("");
  const [expandedMatches, setExpandedMatches] = useState({}); // Track expanded states

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await response.json();
        setVersion(versions[0]);
      } catch (error) {
        console.error("Error fetching Data Dragon version:", error);
      }
    };
    fetchVersion();
  }, []);

  const fetchMatchHistory = async () => {
    const [gameName, tagLine] = riotID.split("#");

    if (!gameName || !tagLine) {
      console.error("Invalid Riot ID format. Please use format 'player#NA1'.");
      return;
    }

    try {
      const puuidResponse = await fetch(`${backendUrl}/api/riot/puuid/${gameName}/${tagLine}`);
      const puuid = await puuidResponse.json();

      const matchHistoryResponse = await fetch(`${backendUrl}/api/riot/match-history/${puuid}`);
      const matchIds = await matchHistoryResponse.json();

      const matches = await Promise.all(
        matchIds.map(async (matchId) => {
          const matchDetailResponse = await fetch(`${backendUrl}/api/riot/match-details/${matchId}`);
          const matchData = await matchDetailResponse.json();
          const userMatchData = matchData.info.participants.find(p => p.puuid === puuid);

          const items = [
            userMatchData.item0, userMatchData.item1, userMatchData.item2, userMatchData.item3,
            userMatchData.item4, userMatchData.item5, userMatchData.item6
          ].filter(itemId => itemId !== 0);

          const teamId = userMatchData.teamId;
          const allies = matchData.info.participants
            .filter(participant => participant.teamId === teamId && participant.puuid !== puuid)
            .map(player => ({
              summonerName: player.summonerName || "Hidden",
              champion: player.championName,
              items: [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5, player.item6].filter(itemId => itemId !== 0),
            }));

          const enemies = matchData.info.participants
            .filter(participant => participant.teamId !== teamId)
            .map(player => ({
              summonerName: player.summonerName || "Hidden",
              champion: player.championName,
              items: [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5, player.item6].filter(itemId => itemId !== 0),
            }));

          const matchDate = new Date(matchData.info.gameCreation).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit"
          });

          return {
            matchId,
            matchDate,
            champion: userMatchData.championName,
            result: userMatchData.win ? "Win" : "Loss",
            items,
            gameMode: matchData.info.gameMode,
            allies,
            enemies,
          };
        })
      );

      const matchesByDate = matches.reduce((groupedMatches, match) => {
        if (!groupedMatches[match.matchDate]) {
          groupedMatches[match.matchDate] = [];
        }
        groupedMatches[match.matchDate].push(match);
        return groupedMatches;
      }, {});

      setMatchHistory(matchesByDate);
      setExpandedMatches({});
      setIsHistoryVisible(true);
    } catch (error) {
      console.error("Error fetching match data:", error);
      setIsHistoryVisible(false);
    }
  };

  const toggleMatchDetails = (matchId) => {
    setExpandedMatches((prevState) => ({
      ...prevState,
      [matchId]: !prevState[matchId],
    }));
  };

  return (
    <div className="p-10">
      <h1 className="relative flex justify-center py-20 mt-2 mb-1 text-8xl bg-cover bg-[center_30%] font-extrabold rounded-3xl border bg-[url('\Talon_0.jpg')] text-white">
        <div className="absolute inset-0 bg-black opacity-50 rounded-3xl border"></div>
        <span className="relative z-10">MTY.LOL</span>
      </h1>

      <section className="flex flex-col items-center py-20 px-30 text-2xl">
        <input
          type="text"
          value={riotID}
          onChange={(e) => setRiotID(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchMatchHistory()}
          placeholder="Enter Riot ID, ie. player#NA1"
          className="w-2/3 py-5 px-5 rounded-xl mb-5"
        />
        <button onClick={fetchMatchHistory} className="bg-navy-blue text-white py-3 px-6 rounded-lg mt-14 border-black border">
          Get Match Info
        </button>

        {isHistoryVisible && (
          <div className="mt-[8%] w-11/12 border border-black rounded-3xl p-5 bg-navy-blue">
            <h2 className="text-3xl font-bold mb-3 text-center text-white">Match History</h2>

            {Object.keys(matchHistory).map((date) => (
              <div key={date}>
                <h3 className="text-2xl font-bold mb-4 mt-6 text-white">{date}</h3>
                <div className="space-y-4">
                  {matchHistory[date].map((match) => (
                    <div key={match.matchId} className="rounded-lg shadow-sm">
                      <div
                        className={`flex items-center p-4 cursor-pointer rounded-md ${
                          match.result === 'Win'
                            ? 'bg-gradient-to-l from-green-200 to-white'
                            : 'bg-gradient-to-r from-red-200 to-white'
                        }`}
                        onClick={() => toggleMatchDetails(match.matchId)}
                      >
                        <div className="flex items-center space-x-4 w-1/3">
                          <img
                            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${match.champion}.png`}
                            alt={match.champion}
                            className="w-12 h-12"
                          />
                          <span className="text-lg font-semibold">{match.champion}</span>
                        </div>
                        <div className="text-lg font-medium text-gray-700 w-1/3 text-center">{match.gameMode}</div>
                        <div className="flex space-x-2 ml-auto">
                          {match.items.map((item, idx) => (
                            <img
                              key={idx}
                              src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item}.png`}
                              alt={`Item ${item}`}
                              className="w-8 h-8"
                            />
                          ))}
                        </div>
                      </div>

                      {expandedMatches[match.matchId] && (
                        <div className="bg-gray-100 p-4 rounded-lg overflow-hidden">
                          <h3 className="text-xl font-bold mb-2">Allied Team</h3>
                          <div className="space-y-2 mb-4">
                            {match.allies.map((ally, idx) => (
                              <div key={idx} className="flex items-center space-x-4">
                                <img
                                  src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${ally.champion}.png`}
                                  alt={ally.champion}
                                  className="w-10 h-10"
                                />
                                <span className="text-lg w-24">{ally.champion}</span>
                                <span className="font-semibold flex-1">{ally.summonerName || "Hidden"}</span>
                                <div className="flex space-x-2 ml-auto">
                                  {ally.items.map((item, idx) => (
                                    <img
                                      key={idx}
                                      src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item}.png`}
                                      alt={`Item ${item}`}
                                      className="w-6 h-6"
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <hr className="border-t-2 border-gray-300 my-4" />

                          <h3 className="text-xl font-bold mt-4 mb-2">Enemy Team</h3>
                          <div className="space-y-2">
                            {match.enemies.map((enemy, idx) => (
                              <div key={idx} className="flex items-center space-x-4">
                                <img
                                  src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${enemy.champion}.png`}
                                  alt={enemy.champion}
                                  className="w-10 h-10"
                                />
                                <span className="text-lg w-24">{enemy.champion}</span>
                                <span className="font-semibold flex-1">{enemy.summonerName || "Hidden"}</span>
                                <div className="flex space-x-2 ml-auto">
                                  {enemy.items.map((item, idx) => (
                                    <img
                                      key={idx}
                                      src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item}.png`}
                                      alt={`Item ${item}`}
                                      className="w-6 h-6"
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;

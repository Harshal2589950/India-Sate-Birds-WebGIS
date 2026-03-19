// =====================
// BASE MAP
// =====================

var street = L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
);

var satellite = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
);

var terrain = L.tileLayer(
'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
);

var dark = L.tileLayer(
'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
);

var map = L.map('map',{
center:[22.5,80],
zoom:5,
layers:[street]
});

var baseMaps = {
"Street Map":street,
"Satellite":satellite,
"Terrain":terrain,
"Dark Map":dark
};

L.control.layers(baseMaps).addTo(map);


// =====================
// STORAGE OBJECTS
// =====================

var birdData = {};
var markers = {};


// =====================
// NORMALIZE FUNCTION
// =====================

function normalizeState(name){

return name
.replace(/_/g," ")
.replace("UT of ","")
.replace("(NCT)","")
.replace(/&/g,"and")
.trim()
.toLowerCase();

}


// =====================
// LOAD CSV DATA
// =====================

Papa.parse("Data/State_Bird.csv", {

download: true,
header: true,

complete: function(results) {

var gallery = document.getElementById("birdGallery");

results.data.forEach(function(row){

if(!row["State Name"]) return;
if(row["State Name"] === "UT of Dadra & Nagar Haveli and Daman & Diu") return;

var key = normalizeState(row["State Name"]);
birdData[key] = row;


// gallery card

var card = document.createElement("div");
card.className = "bird-card";

card.innerHTML = `
<img src="${row["Image"]}">
<div class="bird-name">${row["Common Name"]}</div>
`;

card.onclick = function(){

var stateKey = normalizeState(row["State Name"]);

if(markers[stateKey]){
map.setView(markers[stateKey].getLatLng(),6);
markers[stateKey].openPopup();
}

};

gallery.appendChild(card);

});


// =====================
// DROPDOWN
// =====================

var dropdown = document.getElementById("stateDropdown");

results.data.forEach(function(row){

if(!row["State Name"]) return;
if(row["State Name"] === "UT of Dadra & Nagar Haveli and Daman & Diu") return;

var option = document.createElement("option");
option.text = row["State Name"];
option.value = normalizeState(row["State Name"]);

dropdown.appendChild(option);

});


// =====================
// LOAD GEOJSON
// =====================

fetch("Data/India_States.geojson")

.then(res => res.json())

.then(data => {

L.geoJSON(data,{

style:{
color:"#000000",
weight:2,
fillOpacity:0.1
},

onEachFeature:function(feature,layer){

var state = "";

if(feature.properties){

state =
feature.properties.ST_NM ||
feature.properties.STATE_NAME ||
feature.properties.NAME_1 ||
feature.properties.NAME ||
feature.properties.State ||
feature.properties.state;

}

if(!state) return;

var key = normalizeState(state);
var center = layer.getBounds().getCenter();

if(birdData[key]){

var bird = birdData[key];

var icon = L.icon({
iconUrl: bird["Image"],
iconSize:[90,90],
iconAnchor:[40,40],
popupAnchor:[0,-40]
});

var marker = L.marker(center,{icon:icon}).addTo(map);
markers[key] = marker;

var popup = `
<div class="popup-card">

<div class="popup-title">${bird["Common Name"]}</div>

<div class="popup-text state">State: ${bird["State Name"]}</div>

<div class="popup-text scientific">
Scientific Name: ${bird["Scientific Name"]}
</div>

<div class="popup-text family">
Family: ${bird["Family"]}
</div>

<div class="popup-text iucn">
IUCN Status: ${bird["IUCN Status / List"]}
</div>
<div class="popup-text habitat">
Habitat: ${bird["Habitat"]}
</div>
<div class="popup-text">
Photograph By: ${bird["Photograph By"]}
</div>

<img class="popup-img" src="${bird["Image"]}">

<br>

<a class="popup-btn" href="${bird["Bird_Link"]}" target="_blank">
🔗 View Bird Details
</a>

</div>
`;

marker.bindPopup(popup);

layer.on("click",function(){
map.setView(center,6);
marker.openPopup();
});

}

}

}).addTo(map);

});

}

});


// =====================
// DROPDOWN SELECT
// =====================

document.getElementById("stateDropdown")
.addEventListener("change",function(){

var state = this.value;

if(markers[state]){
map.setView(markers[state].getLatLng(),6);
markers[state].openPopup();
}

});


// =====================
// SEARCH STATE
// =====================

document.getElementById("searchBox")
.addEventListener("keyup",function(){

var input = this.value.toLowerCase();

for(var state in markers){

if(state.includes(input)){
map.setView(markers[state].getLatLng(),6);
markers[state].openPopup();
break;
}

}

});


// =====================
// EXTRA UT STATES FIX
// =====================

var extraStates = {

"chandigarh":[30.7333,76.7794],
"delhi":[28.6139,77.2090],
"ladakh":[34.1526,77.5771],
"puducherry":[11.9416,79.8083]

};

for(var state in extraStates){

var key = normalizeState(state);

if(!markers[key] && birdData[key]){

var bird = birdData[key];

var icon = L.icon({
iconUrl: bird["Image"],
iconSize:[80,80],
iconAnchor:[40,40],
popupAnchor:[0,-30]
});

var marker = L.marker(extraStates[state],{icon:icon}).addTo(map);
markers[key] = marker;

marker.bindPopup(`
<div class="popup-card">

<div class="popup-title">${bird["Common Name"]}</div>

<div class="popup-text state">State: ${bird["State Name"]}</div>

<div class="popup-text scientific">
Scientific Name: ${bird["Scientific Name"]}
</div>

<div class="popup-text family">
Family: ${bird["Family"]}
</div>

<div class="popup-text iucn">
IUCN Status: ${bird["IUCN Status / List"]}
</div>

<div class="popup-text">
Photograph By: ${bird["Photograph By"]}
</div>

<img class="popup-img" src="${bird["Image"]}">

<br>

<a class="popup-btn" href="${bird["Bird_Link"]}" target="_blank">
🔗 View Bird Details
</a>

</div>
`);

}

}
// =====================
// BIRD FILTER SYSTEM
// =====================

document.getElementById("iucnFilter")

.addEventListener("change",function(){

var selected = this.value;

for(var state in markers){

var bird = birdData[state];

var status = bird["IUCN Status / List"];

if(selected=="" || status.includes(selected)){

markers[state].addTo(map);

}

else{

map.removeLayer(markers[state]);

}

}

});



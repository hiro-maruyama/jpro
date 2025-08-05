//import maplibregl from 'maplibre-gl';
//import 'maplibre-gl/dist/maplibre-gl.css';
//import 'https://unpkg.com/maplibre-gl@5.0.1/dist/maplibre-gl.css';     
//import 'https://unpkg.com/maplibre-gl@5.0.1/dist/maplibre-gl.js';
//import "https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js"


let protocol = new pmtiles.Protocol({metadata:true});
maplibregl.addProtocol("pmtiles",protocol.tile);

const map = new maplibregl.Map({
    container: 'map',
    center: [100.64, 13.75],
    zoom: 9.5,
//   minZoom: 7,
    maxZoom: 18,
    style: './style/fstyle4ppt-dp.json', //hash, true,
});

//
const layonoff1 = document.getElementById("gistda-layer");
const layonoff2 = document.getElementById("pop-station-Layer");
const layonoff3 = document.getElementById("railway-Layer");
const layonoff4 = document.getElementById("station2bus-Layer");
const layonoff5 = document.getElementById("pop-change-Layer");
const layonoff6 = document.getElementById("busstop-Layer");


// ズームレベルを取得
var currentZoom = map.getZoom();
console.log('Current Zoom Level:', currentZoom);


var buspoint;
var nbstopx;
var nbstopy;
let blref=[];

//----- 3/16 add -----
let popvLayer='pop-station-Layer'
let featuresList=[];

      // ズームレベルを表示する要素を取得
const zoomLevelElement = document.getElementById('zoom-level');

      // ズームレベルの表示を更新する関数
function updateZoomLevel() {
    const zoomLevel = map.getZoom();
    zoomLevelElement.textContent = `Zoom Level: ${zoomLevel.toFixed(2)}`;
}

// function to get bus route stopping specified bus stop
// 初期化: 空のリスト
//let blrefList = [];

/*
function updateBlref(newBlref) {
    // リストに新しいblrefが含まれていない場合のみ追加
    if (!blrefList.includes(newBlref)) {
        blrefList.push(newBlref);
        
        // フィルターを更新
        map.setFilter('busroute-Layer', ['in', 'ref', ...blrefList]);
    }
} */



// action to the map
map.on('load', () => {

    let busstop_red=0;//0:bus stop is not red, 1:bus stop is red
    let busroute_grn=0;//0:bus routes are not shown in light blue, 1: bus routes are shown in light blue
 
    // 駅に近いバス停
    let nbstopx = 0;
    let nbstopy = 0;

    // マウスカーソルがポイントに移動したときの処理
    map.on('mousemove', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['station2bus-Layer'],  // dist_rst2bsp_sl.geojson のこと(PMTiles化する前）
        });

    // バス停が表示されているときの処理

        let busp_visibility = map.getLayoutProperty("busstop-Layer", "visibility");
        if (busp_visibility === undefined) {
            busp_visibility ="visible";   // 非常手段。あまりよくない。
        }

        if (busp_visibility=== "visible" && busroute_grn==0) {
            
            if (features.length > 0) {
                map.getCanvas().style.cursor = 'pointer'; // カーソルをポインターに変更
                const feature = features[0];
                nbstopx = feature.properties.X1;
                nbstopy = feature.properties.Y1;

                console.log('feature.length:', features.length);

                const nesbspFeature = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [nbstopx, nbstopy],
                    },
                };
                map.getSource('nearbsp').setData({  // 駅近くのバス停を赤く表示
                    type: 'FeatureCollection',
                    features: [nesbspFeature],
                });
            } else {
                map.getCanvas().style.cursor = '';

            // バスルートが表示されていない場合、nearbspのデータを空にする
                if (busroute_grn == 0) {
                    map.getSource('nearbsp').setData({
                        type: 'FeatureCollection',
                        features: [],
                   });
                }
            }
        }
    });

    map.on('click', (e) => {
        var flength = map.querySourceFeatures('nearbsp').length;
        console.log('nearbsp:', flength);
 //       if (flength > 0 & situ == 1) {
        if (flength > 0) {
        //    const bfeatures = map.querySourceFeatures('busroute');
            const buffer = 10;

            let bpoint = [nbstopx, nbstopy];
            console.log('point coordinate:', [nbstopx, nbstopy]);
            //           console.log('bfeatures[0].id:', bfeatures[0].properties.id); 
            const screenPoint = map.project([nbstopx,nbstopy]); // バス停の座標を画面座標に変換
            const bfeatures = map.queryRenderedFeatures([[screenPoint.x-buffer,screenPoint.y-buffer],[screenPoint.x+buffer,screenPoint.y+buffer]],{ layers: ['busroute-Layer']});// PMTiles化の影響

            let closestFeature = null;
            let minDistance = Infinity;

            console.log('bfeature.length:', bfeatures.length);
//            for (let i=0; i<bfeatures.length;i++){
//                console.log('bfeatures[',i,']:', bfeatures[i].properties.ref);    
//            }

            bfeatures.forEach(feature => {
                if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                    // 各ラインフィーチャとの最短距離を計算
                    const line = feature.geometry.coordinates;
//                    console.log('line:', line);
                    //           const distance = turf.pointToLineDistance(point, feature.geometry);
                    const distance = turf.pointToLineDistance(bpoint, line);

                    // 最短距離のラインを選択
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestFeature = feature;
                    }
                }
            });

            console.log('minDistance:',minDistance);
            
            let blrefList = [];

            bfeatures.forEach(feature => {
                if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                    // 各ラインフィーチャとの最短距離を計算
                    const line2 = feature.geometry.coordinates;
//                    console.log('line:', line);
                    //           const distance = turf.pointToLineDistance(point, feature.geometry);
                    const distance2 = turf.pointToLineDistance(bpoint, line2);

                    // 最短距離のラインを選択
                    if (Math.abs(distance2 - minDistance) <0.01) {
                        blref = feature.properties.ref;
                        if (!blrefList.includes(blref)) {
                            blrefList.push(blref);
                        }
                    }
                }
            }); // 同じことを2回行うのは、最短距離と10m以下しか違わないライン（バス路線も）拾うため

            if (closestFeature) {
                console.log('最も近いラインフィーチャ:', closestFeature);
                console.log('距離', minDistance);
                const refString=blrefList.join(',');
                console.log('ref', refString);
                map.setFilter('busroute-Layer', ['in', 'ref', ...blrefList]); // ref(バス路線番号)のものを水色で表示する。
                map.setPaintProperty('busroute-Layer', 'line-opacity', 1);
                busroute_grn = 1; // バスルートが表示されていることを示すフラグを更新
            } else {
                console.log('ラインが見つかりませんでした');
                console.log('currect fileter:', map.getFilter('busroute-Layer'));
            } 
        }

    });

    // バスルート表示を非表示、最近隣バス停の赤色を緑にする。
    map.on('contextmenu', (e) => {
        console.log('contextmenu event triggered');
        map.setFilter('busroute-Layer', ['none']);
        map.setPaintProperty('busroute-Layer', 'line-opacity', 0);
        busroute_grn = 0; // バスルートが非表示になったことを示すフラグを更新
        buspoint = [nbstopx, nbstopy];
        const nesbspFeature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: buspoint,
            },
        };
        map.getSource('nearbsp').setData({
            type: 'FeatureCollection',
            features: [],
        });
    }
);


    // population annotation layer generation   

        map.on('zoom', (e) => {

            currentZoom = map.getZoom();      

            if (layonoff2.checked==true) {
                if (currentZoom < 12 ) {
                    map.setLayoutProperty('populva-Layer', 'visibility', 'none');
                    map.setLayoutProperty('populcgva-Layer', 'visibility', 'none');
                } else if (currentZoom > 12 || currentZoom== 12) {
 //               popvLayer='pop-station-Layer';
                    map.setLayoutProperty('populva-Layer', 'visibility', 'visible');
                }
            } 
            if (layonoff5.checked==true) {
                if (currentZoom < 12 ) {
                    map.setLayoutProperty('populcgva-Layer', 'visibility', 'none');
                    map.setLayoutProperty('populva-Layer', 'visibility', 'none');
                } else if (currentZoom > 12 || currentZoom== 12) {
                    map.setLayoutProperty('populcgva-Layer', 'visibility', 'visible');
                }
            }

            // smaller point size for station when zoom level is low 
            let radius;
            if (currentZoom < 11){
                radius = 3;
            } else if (currentZoom >11) {
                radius = 4;
            }

            map.setPaintProperty('station2bus-Layer','circle-radius',radius)

            if (currentZoom < 10.5) {
                map.setPaintProperty('busroute-Layer', 'line-opacity', 0);
               
            } else if (currentZoom > 10.5 & blref.length!=0) {
                // バスルート表示フラグが立っている場合のみ、ズームしてもバスルートを水色で表示
                if (busroute_grn == 1) {
                    map.setPaintProperty('busroute-Layer', 'line-opacity', 1);
                }
            }
        });  

        map.on('move', (e) => {  //マップが移動もしくはズームしたとき発生

            currentZoom = map.getZoom();      

            if (layonoff2.checked==true) {
                if (currentZoom < 12 ) {
                    map.setLayoutProperty('populva-Layer', 'visibility', 'none');
                    map.setLayoutProperty('populcgva-Layer', 'visibility', 'none');                 
                } else if (currentZoom > 12 || currentZoom== 12) {
 //               popvLayer='pop-station-Layer';
                    map.setLayoutProperty('populva-Layer', 'visibility', 'visible');
                }
            } 
            if (layonoff5.checked==true) {
                if (currentZoom < 12 ) {
                    map.setLayoutProperty('populcgva-Layer', 'visibility', 'none');
                    map.setLayoutProperty('populva-Layer', 'visibility', 'none');                   
                } else if (currentZoom > 12 || currentZoom== 12) {
                    map.setLayoutProperty('populcgva-Layer', 'visibility', 'visible');
                }
            }

        });      
        
    });

/*
* チェックボックスのオンオフを元に、レイヤの表示/非表示を切り替えます
*/


      // チェックボックスの変更に応じて他のチェックボックスも操作する関数
function updateCheckboxes(checkboxId) {
        // すべてのチェックボックスを取得
    const checkboxes = ['pop-station-Layer', 'pop-change-Layer'];

    checkboxes.forEach(id => {
          if (id !== checkboxId) {
            const checkbox = document.getElementById(id);
            // チェックボックスの状態を反転させる
            checkbox.checked = document.getElementById(checkboxId).unchecked;
        }
    });
}

// 基盤地図レイヤの表示・非表示の切り替えの関数

function setLayerVisibilityBySource(sourceName, visibility) {
  const layers = map.getStyle().layers;
  for (const layer of layers) {
    if (layer.source === sourceName) {
      map.setLayoutProperty(layer.id, 'visibility', visibility);
    }
  }
}



/*
const layonoff1 = document.getElementById("osm-layer");
const layonoff2 = document.getElementById("pop-station-Layer");
const layonoff3 = document.getElementById("railway-Layer");
const layonoff4 = document.getElementById("station2bus-Layer");
const layonoff5 = document.getElementById("pop-change-Layer");
*/

layonoff1.addEventListener('click', () => {
    if (layonoff1.checked == true) {
//        map.setLayoutProperty("gistda-layer", "visibility", "visible");
        setLayerVisibilityBySource('sphere', 'visible'); // 表示
    } else {
//        map.setLayoutProperty("gistda-layer", "visibility", "none");
        setLayerVisibilityBySource('sphere', 'none'); // 非表示  
    }
});
layonoff2.addEventListener('click', () => {
    if (layonoff2.checked == true) {
        map.setLayoutProperty("pop-station-Layer", "visibility", "visible");
        map.setLayoutProperty("pop-change-Layer", "visibility", "none");
        map.setLayoutProperty('populcgva-Layer', 'visibility', 'none');
        updateCheckboxes('pop-station-Layer');
        document.getElementById('calculation').disabled = false; 
        document.getElementById('calculation').textContent='access calculation';
    } else if (layonoff2.checked == false) {
        // チェックボックスのチェックが外れた場合、レイヤを非表示にする
        map.setLayoutProperty("pop-station-Layer", "visibility", "none");
        map.setLayoutProperty('populva-Layer', 'visibility', 'none');
        document.getElementById('calculation').disabled = true;
        document.getElementById('calculation').textContent='not availavle';
        document.getElementById('tot-pop').value='';
        document.getElementById('acc-pop').value='';
        document.getElementById('per-pop').value='';
    }
});
layonoff5.addEventListener('click', () => {
    if (layonoff5.checked == true) {
        map.setLayoutProperty("pop-change-Layer", "visibility", "visible");
        map.setLayoutProperty("pop-station-Layer", "visibility", "none");
        map.setLayoutProperty('populva-Layer', 'visibility', 'none');//6/1
       
        updateCheckboxes('pop-change-Layer');
        document.getElementById('calculation').disabled = true;
        document.getElementById('calculation').textContent='not availavle';
        document.getElementById('tot-pop').value='';
        document.getElementById('acc-pop').value='';
        document.getElementById('per-pop').value='';

    } else {
            // チェックボックスのチェックが外れた場合、レイヤを非表示にする
        map.setLayoutProperty("pop-change-Layer", "visibility", "none");
        map.setLayoutProperty('populcgva-Layer', 'visibility', 'none');//6/1
    }
});
layonoff3.addEventListener('click', () => {
    if (layonoff3.checked == true) {
        map.setLayoutProperty("railway-Layer", "visibility", "visible");
    } else {
        map.setLayoutProperty("railway-Layer", "visibility", "none");
    }
});
layonoff4.addEventListener('click', () => {
    if (layonoff4.checked == true) {
        map.setLayoutProperty("station2bus-Layer", "visibility", "visible");
    } else {
        map.setLayoutProperty("station2bus-Layer", "visibility", "none");
    }
});
layonoff6.addEventListener('click', () => {
    if (layonoff6.checked == true) {
        map.setLayoutProperty("busstop-Layer", "visibility", "visible");
    } else {
        map.setLayoutProperty("busstop-Layer", "visibility", "none");
    }
});

document.getElementById("home").addEventListener("click", function () {
    window.location.href = "index-menu-dp.html";
});


// % popultion for set distance level 

const calButton = document.getElementById('calculation');
calButton.addEventListener('click', () => {
    //   alert('Button pushed');
    const popfeas = map.queryRenderedFeatures({ layers: ['pop-station-Layer',] });
    //   alert (popfeas.length);

    const thrnumber = parseInt(document.getElementById('thr-number').value); //Threshold
    //    alert ('thr-number='+thrnumber);

    var setcnt = [];
    let i;
    var id_num; var id_num2;
    var pop_d2; var dis22s;
    var total_p = 0; var ac_p = 0;

    for (i = 0; i < 1877; i++) {
        setcnt[setcnt.length] = 0;
    };
    for (i = 0; i < popfeas.length; i++) {
        //               for (i =0; i < 3;i++) {
        const popfea = popfeas[i];
        id_num = popfea.properties.pid - 1;
//        pop_d2 = popfea.properties.z;
        pop_d2 = popfea.properties["pop-rev"]; // due to population correction
        dis22s = popfea.properties.dis2;
        setcnt[id_num] = setcnt[id_num] + 1;
        //          alert (setcnt[id_num]+':'+id_num);
        if (setcnt[id_num] < 2) {
            total_p = total_p + pop_d2;
            total_p = total_p;
            if (dis22s < thrnumber) { ac_p = ac_p + pop_d2; }
        }
        else if (setcnt[id_num] > 1) {
            id_num2 = id_num + 1;
            //                      alert ('id:'+id_num2+setcnt[id_num]);
        };
    };

    var ratio = Math.round(1000 * ac_p / total_p) / 10;
    document.getElementById('tot-pop').value = Math.round(total_p);
    document.getElementById('acc-pop').value = Math.round(ac_p);
    document.getElementById('per-pop').value = ratio;

    //   alert ('finish'+i);
    //   alert ('*** population who live less than '+thrnumber+' m *** \n' +Math.round(ac_p) + '\n'+ '*** total population:*** \n'+Math.round(total_p)+'\n' +ratio+' %');

});

document.getElementById("toggle-legend").addEventListener("click", function () {
    var overlay = document.querySelector(".map-overlay");

    // 現在の表示状態を確認し、切り替える
    if (overlay.style.display === "none") {
        overlay.style.display = "block";  // 表示する
        document.getElementById("toggle-legend").innerText = "off"; // ボタンの文字を変更
    } else {
        overlay.style.display = "none";  // 非表示にする
        document.getElementById("toggle-legend").innerText = "on"; // ボタンの文字を変更
    }
}); 

// ズームレベルが変更されるたびに更新
map.on('zoom', updateZoomLevel);

// 初期表示を設定
updateZoomLevel();

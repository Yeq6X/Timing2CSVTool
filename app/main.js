bsCustomFileInput.init();

document.getElementById('inputFileReset').addEventListener('click', function() {

  bsCustomFileInput.destroy();

  var elem = document.getElementById('inputFile');
  elem.value = '';
  var clone = elem.cloneNode(false);
  elem.parentNode.replaceChild(clone, elem);

  bsCustomFileInput.init();

});

var data = null;
function onChange(input) {
  if (input.files.length > 0) {
    var file = input.files[0];
    var reader = new FileReader();
    reader.addEventListener('load', () => {
      data = reader.result;
    });
    reader.readAsDataURL(file);
  }
}

var CSVdata = null;
function loadLocalCSV(e) {
  var fileData = e.files[0];

  // CSVファイル以外は処理を止める
  if(!fileData.name.match('.csv$')) {
      alert('CSVファイルを選択してください');
      return;
  }

  var reader = new FileReader();

  reader.onload = function() {
    CSVdata = reader.result;
  }
  // ファイル読み込みを実行
  reader.readAsText(fileData);
}

// 読み込んだCSVデータを配列に変換する関数
function CSVtoArray(str) {
  var array = [];
  var rowTmp = str.split('\n');

  for (var i = 1; i < str.length; i++) {
    if (rowTmp[i] != undefined && rowTmp[i] != '' && rowTmp[i].split(',')[1] != '')
      array.push(rowTmp[i].split(','));
  }
  return array;
}


var sound = null;
var soundId = null;
var rythmSound = null;
var playingTime = 0;
var pxPerSec = 50;
var seekOffsetTime = 0;
var scrollAmount = 0.3;
var zoomAmount = 0.04;
var viewLayerWidth;
var viewLayerHeight = window.innerHeight;
var bgmDuration = window.window.innerWidth-300/pxPerSec;
var topY = 0;
var timeDisplayBarHeihgt = 20;
var seekBarHeight = 30;
var petifitRowHeight = 60;
var petifitNotesArray = [[], [], [], [], [], [], [], [], [], []];
var petifitOffsetTimeArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var bgmNotes = [];
var addNodeTime = 0;
var addNodeInputNum = 0;
var delNodeIndex_i = null;
var delNodeIndex_j = null;
var globalBPM = 105;

// konva
var width = window.innerWidth-300;
var height = window.innerHeight;

var stage = new Konva.Stage({
  container: 'container',
  width: width,
  height: height,
});

var staticLayer = new Konva.Layer();

var line = new Konva.Line({
  points: [0, topY + timeDisplayBarHeihgt + seekBarHeight-1, width, topY + timeDisplayBarHeihgt + seekBarHeight-1],
  stroke: 'brack',
  strokeWidth: 2,
  lineCap: 'round',
  lineJoin: 'round',
});

for (var i = 1; i < viewLayerHeight/petifitRowHeight; i++) {
  var newLine = new Konva.Line({
    points: [0, topY + timeDisplayBarHeihgt + seekBarHeight-1 + petifitRowHeight*i, width, topY + timeDisplayBarHeihgt + seekBarHeight-1 + petifitRowHeight*i],
    stroke: '#ccc',
    strokeWidth: 2,
  });
  staticLayer.add(newLine);
}

staticLayer.add(line);
stage.add(staticLayer);

/**
 *  TIMELINELAYER
 */
var timeLineLayer = new Konva.Layer({
  x:50,y:0
});

// vertical line
var linePer1sArray = [];
for (var i = 0; i < bgmDuration; i++) {
  var newLineGroup = new Konva.Group({
    x: pxPerSec*i, y: 0,
    y: 0,
  })
  var newLine = new Konva.Line({
    points: [0, topY + timeDisplayBarHeihgt, 0, viewLayerHeight],
    stroke: '#ccc',
    strokeWidth: 1,
    offset: {
      x: 0,
      y: 0,
    },
  });
  var newTime = new Konva.Text({
    x: 0, y: 0,
    fontSize: 16,
    padding: 3,
    fontFamily: 'Calibri',
    text: i,
    fill: '#aaa',
    align: 'center',
    offset: {
      x: 10,
      y: 0,
    },
  })

  newLineGroup.add(newLine);
  newLineGroup.add(newTime);
  timeLineLayer.add(newLineGroup);
  linePer1sArray.push(newLineGroup);
}

// seekCursor
var seekCursorGroup = new Konva.Group({
  x: (playingTime-seekOffsetTime)*pxPerSec,
  y: topY,
  draggable: true,
  dragBoundFunc: function (pos) {
    return {
      x: pos.x,
      y: this.absolutePosition().y,
    };
  }
})
var seekCursorCol = new Konva.Rect({
  width: 25,
  height: timeDisplayBarHeihgt + seekBarHeight,
  offset: {
    x: 25/2,
    y: 0,
  },
  fill: '#0002'
})
var seekCursor = new Konva.Line({
  points: [0, 0, 0, viewLayerHeight],
  stroke: 'red',
  strokeWidth: 2,
  offset: {
    x: 0,
    y: 0,
  },
});
var seekTimeText = new Konva.Text({
  x: 0,
  y: timeDisplayBarHeihgt,
  fontSize: 16,
  padding: 7,
  fontFamily: 'Calibri',
  text: playingTime,
  fill: 'black',
  offset: {
    x: 0,
    y: 0,
  },
});

seekCursorGroup.add(seekCursorCol);
seekCursorGroup.add(seekCursor);
seekCursorGroup.add(seekTimeText);

timeLineLayer.add(seekCursorGroup);
stage.add(timeLineLayer);
viewLayerWidth = timeLineLayer.width();
viewLayerHeight = timeLineLayer.height();


function BGMLoad() {
  if (data != null)
  {
    if (sound != null) sound.stop();
    sound = new Howl({
      src: data,
      volume: 0.8,
    });
    sound.on('load', () => {
      bgmDuration = sound.duration();
      timeLineLayer.width(bgmDuration*pxPerSec);
    })
    playingTime = 0;
    seekOffsetTime = 0;
  }
}

function RythmSoundLoad() {
  rythmSound = new Howl({
    src: '../assets/sound1.mp3',
  });
  rythmSound.on('load', () => {
  })
}
RythmSoundLoad();

// 消すときのイベント
var countDelIndex = e => {
  // 右クリックのとき
  if (e.evt.button === 2) {
    document.getElementById('addNodeButton').style.display = 'none';
    document.getElementById('delNodeButton').style.display = 'block';

    // 消すnotesのインデックスをカウント
    for (var i = 0; i < petifitNotesArray.length; i++) {
      for (var j = 0; j < petifitNotesArray[i].length; j++) {
        if (e.target === petifitNotesArray[i][j].point) {
          delNodeIndex_i = i;
          delNodeIndex_j = j;
        }
      }
    }
  }
}

function LoadBGMCSV() {
  var res = CSVtoArray(CSVdata);
  var bpmElm = document.getElementById('bpm-input-form');
  var bpm = parseFloat(bpmElm.value);
  globalBPM = bpm;

  for (var i = 0; i < res.length; i++) {
    var timing = parseFloat(res[i][0]);
    var inputNumStr = res[i][1].split('');

    inputNumStr.forEach(e => {

      var inputNum = parseInt(e);
      if (petifitNotesArray[inputNum] == undefined) petifitNotesArray[inputNum] = [];
      var newNotes = CreateNotes(timing*(60/bpm), inputNum);

      // 右クリックイベント
      newNotes.point.on('click', countDelIndex);

      petifitNotesArray[inputNum].push(newNotes);


    })
  }
}

function CreateNotes(time, inputNum) {
  var _time = time + petifitOffsetTimeArray[inputNum];

  var newCircle = new Konva.Circle({
    x: _time*pxPerSec,
    y: topY + timeDisplayBarHeihgt + seekBarHeight + (inputNum+0.5)*petifitRowHeight,
    radius: 3.5,
    fill: 'blue',
    draggable: true,
    dragBoundFunc: function (pos) {
      return {
        x: pos.x,
        y: this.absolutePosition().y,
      };
    }
  });
  timeLineLayer.add(newCircle);
  stage.batchDraw();

  // オブジェクト生成
  notesObj = {time : _time, point: newCircle, inputNum};

  notesObj.point.on('dragmove', function () {
    notesObj.time = notesObj.point.x()/pxPerSec;
  });

  notesObj.point.on('dragend', function () {
    console.log(notesObj.time);
    if (notesObj.point.x() < 0) {
      notesObj.time = 0;
      notesObj.point.x(0);
      stage.batchDraw();
    }
    else {
      notesObj.time = notesObj.point.x()/pxPerSec;
    }
  });


  return notesObj;
}

var playIntervalId = null;
var playFunc = () => {
  // これからくるノーツの配列
  var _notes = new Array(petifitNotesArray.length);
  for (var i = 0; i < petifitNotesArray.length; i++) {
    console.log(petifitNotesArray.length)
    for (var j = 0; j < petifitNotesArray[i].length; j++) {
      if (petifitNotesArray[i][j].time > playingTime) break;
    }
    _notes[i] = petifitNotesArray[i].slice(j);
  }

      console.log(_notes[0].length, _notes[1].length, _notes[2].length, _notes[3].length, _notes[4].length);
  if (!sound.playing()) {
    soundId = sound.play();

    // 10ミリ秒ごとに更新
    playIntervalId = setInterval(()=>{
      playingTime = sound.seek();
      seekCursorGroup.x((playingTime-seekOffsetTime)*pxPerSec);
      seekTimeText.text(Math.round(playingTime*100)/100);
      timeLineLayer.batchDraw();

      // 効果音
      for (var i = 0; i < petifitNotesArray.length; i++) {
        if (_notes[i].length == 0) continue;
        var j = 0;
        while (_notes[i][j] != undefined && _notes[i][j].time < playingTime) {
          try {
            rythmSound.play();
            _notes[i].shift();
            j++;
          } catch(e) { break; }
        }
      }
    }, 10);
  }
  else {
    sound.pause();
    clearInterval(playIntervalId);
  }
}

document.getElementById('play-button').addEventListener('click', playFunc);

window.document.onkeydown = function(event){
  if (event.key === ' ') playFunc();
}

function getRelativePointerPosition(node) {
  var transform = node.getAbsoluteTransform().copy();
  // to detect relative position we need to invert transform
  transform.invert();

  // get pointer (say mouse or touch) position
  var pos = node.getStage().getPointerPosition();

  // now we can find relative point
  return transform.point(pos);
}

stage.on('wheel', function (e) {
  // prevent parent scrolling
  e.evt.preventDefault();
  const dy = e.evt.deltaY;

  if (!e.evt.ctrlKey) {
    timeLineLayer.x(timeLineLayer.x() + dy*scrollAmount);
  }
  else { // 拡大縮小
    // pxPerSecを更新
    prevPxPerSec = pxPerSec;
    pxPerSec += -dy*zoomAmount;
    if (pxPerSec < 0) pxPerSec = 1;

    // seekCursor(赤)の位置を再計算
    seekCursorGroup.x((playingTime-seekOffsetTime)*pxPerSec);

    // 縦棒の位置を再計算
    for (var i = 0; i < bgmDuration; i++) {
      if (pxPerSec < 5 && i % 100 != 0) linePer1sArray[i].opacity(0);
      else if (pxPerSec < 24 && i % 10 != 0) linePer1sArray[i].opacity(0);
      else {
        linePer1sArray[i].opacity(1);
        linePer1sArray[i].x(pxPerSec*i);
      }
    }

    // notesの位置を再計算
    for (var i = 0; i < petifitNotesArray.length; i++) {
      for (var j = 0; j < petifitNotesArray[i].length; j++) {
        petifitNotesArray[i][j].point.x(petifitNotesArray[i][j].time * pxPerSec);
      }
    }

    // マウスカーソルが中心になるようにずらす
    posOnLayer = getRelativePointerPosition(timeLineLayer);
    timeLineLayer.x(timeLineLayer.x() + (posOnLayer.x - posOnLayer.x/prevPxPerSec*pxPerSec));
  }

  stage.batchDraw();
});


seekCursorGroup.on('dragmove', function () {
  playingTime = seekCursorGroup.x()/pxPerSec;
  seekTimeText.text(Math.round(playingTime*100)/100);
  // stage.batchDraw();
});
seekCursorGroup.on('dragend', function () {
  try {
    if (seekCursorGroup.x() < 0) {
      playingTime = 0;
      seekTimeText.text(0);
      seekCursorGroup.x(0);
      stage.batchDraw();
    }
    else {
      playingTime = seekCursorGroup.x()/pxPerSec;
    }

    sound.seek(playingTime);
  } catch (e) {}
});

/**
 *
 * 右クリック
 *
 */
stage.on('contentContextmenu', (e) => {
  e.evt.preventDefault();
});
/**
 *
 */


stage.on('click', e => {
  var posOnStage = getRelativePointerPosition(stage);
  var posOnLayer = getRelativePointerPosition(timeLineLayer);

  // シークバーのクリック
  if (posOnStage.y < seekBarHeight + timeDisplayBarHeihgt) {

    if (posOnLayer.x < 0) {
      playingTime = 0;
      seekTimeText.text(0);
      seekCursorGroup.x(0);
    }
    else {
      playingTime = posOnLayer.x/pxPerSec;
      seekTimeText.text(Math.round(playingTime*100)/100);
      seekCursorGroup.x(posOnLayer.x);
    }

    sound.pause();
    clearInterval(playIntervalId);
    sound.seek(playingTime);
    stage.batchDraw();
  }

  /**
   *
   * 右クリック
   *
   */
  // 右クリックのとき
  if (e.evt.button === 2) {
    addNodeTime = posOnLayer.x/pxPerSec;
    var _y = posOnLayer.y -  (topY + seekBarHeight + timeDisplayBarHeihgt);
    addNodeInputNum = Math.floor(_y / petifitRowHeight);
  }
  /**
   *
   */
})


/**
 *
 * 右クリック
 *
 */
document.getElementById('addNodeButton').addEventListener('click', () => {
  var newNotes = CreateNotes(addNodeTime, addNodeInputNum)
  // 右クリックイベント
  newNotes.point.on('click', countDelIndex);

  // 適切な位置に挿入する
  for (var j = 0; j < petifitNotesArray[addNodeInputNum].length; j++) {
    if (petifitNotesArray[addNodeInputNum][j].time > addNodeTime) break;
  }
  petifitNotesArray[addNodeInputNum].splice(j, 0, newNotes);
})

document.getElementById('delNodeButton').addEventListener('click', () => {
  petifitNotesArray[delNodeIndex_i][delNodeIndex_j].point.destroy();
  stage.batchDraw();
  petifitNotesArray[delNodeIndex_i].splice(delNodeIndex_j, 1);
})

// 右クリックメニュー
window.onload = function(){
  document.body.addEventListener('contextmenu',function(e){
    document.getElementById('contextmenu').style.display="block";
    document.getElementById('contextmenu').style.left=e.pageX+"px";
    document.getElementById('contextmenu').style.top=e.pageY+"px";
    document.getElementById('contextmenu').style.display="block";
  });
  document.body.addEventListener('click',function (e){
    document.getElementById('contextmenu').style.display="none";
    // 追加ボタンにする
    document.getElementById('addNodeButton').style.display = 'block';
    document.getElementById('delNodeButton').style.display = 'none';

  });
}
/**
 *
 */


 for (var i = 0; i < 10; i++) {
  // エレメントpetifitのリスト
  var e = document.createElement('div');
  e.className = 'petifit'
  var nameElm = document.createElement('div');
  nameElm.innerHTML = `FitPattern ${i}`;
  var inputElm = document.createElement('input');
  inputElm.type = 'number';
  inputElm.value = 0;
  inputElm.className = `input-${i}`

  e.appendChild(nameElm);
  e.appendChild(inputElm);
  document.getElementById('petifit-list').appendChild(e);

  // offsetの変更イベント
  inputElm.addEventListener('change', (e) => {
    console.log(e.target.value)
    if (e.target.value == '') e.target.value = 0;
    changedVal = parseFloat(e.target.value);
    var inputNum = parseInt(e.target.className.slice(-1));

    console.log(petifitOffsetTimeArray)

    for (var j = 0; j < petifitNotesArray[inputNum].length; j++) {
      console.log(petifitNotesArray[inputNum][j].time)
      petifitNotesArray[inputNum][j].time -= petifitOffsetTimeArray[inputNum];
      console.log(petifitNotesArray[inputNum][j].time)
      petifitNotesArray[inputNum][j].time += changedVal;
      console.log(petifitNotesArray[inputNum][j].time)
      petifitNotesArray[inputNum][j].point.x(petifitNotesArray[inputNum][j].time * pxPerSec);
    }
    petifitOffsetTimeArray[inputNum] = changedVal;
    console.log(changedVal);
    stage.batchDraw();
  })
}


function GenerateCSV() {
  var csvStr = 'Timing,FitPattern,Action\n';
  var joinedArray = petifitNotesArray.reduce((pre,current) => {pre.push(...current);return pre},[]);
  joinedArray.sort(function(a, b) {
    if (a.time < b.time) {
        return -1;
    } else {
        return 1;
    }
  });
  console.log(joinedArray);

  joinedArray.forEach(function(element){
    var inputNum = element.inputNum;
    var timing = (element.time-petifitOffsetTimeArray[inputNum])/(60/globalBPM);
    console.log(element.time, petifitOffsetTimeArray[inputNum], globalBPM);
    csvStr = csvStr.concat(timing.toString()
                  + ','
                  + element.inputNum
                  + ',\n');
    console.log(timing.toString()
    + ','
    + element.inputNum
    + ',\n');
  });

  return csvStr;
}


function downloadCSV() {
  //ダウンロードするCSVファイル名を指定する
  const filename = "timing.csv";
  //CSVデータ
  const data = GenerateCSV();
  //BOMを付与する（Excelでの文字化け対策）
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  //Blobでデータを作成する
  const blob = new Blob([bom, data], { type: "text/csv" });

  //IE10/11用(download属性が機能しないためmsSaveBlobを使用）
  if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, filename);
  //その他ブラウザ
  } else {
      //BlobからオブジェクトURLを作成する
      const url = (window.URL || window.webkitURL).createObjectURL(blob);
      //ダウンロード用にリンクを作成する
      const download = document.createElement("a");
      //リンク先に上記で生成したURLを指定する
      download.href = url;
      //download属性にファイル名を指定する
      download.download = filename;
      //作成したリンクをクリックしてダウンロードを実行する
      download.click();
      //createObjectURLで作成したオブジェクトURLを開放する
      (window.URL || window.webkitURL).revokeObjectURL(url);
  }
}

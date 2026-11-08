/* Mistir Gift - download verified APK / ZIP, not a GitHub webpage. */
(function () {
  'use strict';
  var zipButtons = ['zipDownloadCta', 'zipMainDownload'].map(function(id){return document.getElementById(id);}).filter(Boolean);
  var apkButtons = ['apkDownloadCta', 'apkMainDownload'].map(function(id){return document.getElementById(id);}).filter(Boolean);
  var messages = ['apkDownloadNote', 'apkAvailability'].map(function(id){return document.getElementById(id);}).filter(Boolean);
  var group = document.querySelector('.app-download-options');

  function message(text) { messages.forEach(function(el){el.textContent=text;}); }
  function controls(buttons, available) { buttons.forEach(function(button){button.disabled=!available;}); }
  function download(format) {
    if (format !== 'zip' && format !== 'apk') return;
    window.location.assign('/api/apk-download?format=' + format);
  }

  zipButtons.forEach(function(button){button.addEventListener('click',function(){if(!button.disabled)download('zip');});});
  apkButtons.forEach(function(button){button.addEventListener('click',function(){if(!button.disabled)download('apk');});});
  controls(zipButtons,false);
  controls(apkButtons,false);

  // In the installed APK there is no reason to show a button for downloading itself.
  if (window.location.hostname === 'appassets.androidplatform.net') {
    if (group) group.hidden=true;
    message('Mistir Gift Demo er installert på Android-enheten din.');
    return;
  }

  var checking = false;
  function checkAvailability() {
    if(checking)return;
    checking=true;
    fetch('/api/apk-download?status=1',{cache:'no-store'})
      .then(function(response){if(!response.ok)throw Error('STATUS_UNAVAILABLE');return response.json();})
      .then(function(data){
        var zip=!!data.zipAvailable, apk=!!data.apkAvailable;
        controls(zipButtons,zip);
        controls(apkButtons,apk);
        if(zip&&apk)message('ZIP og direkte APK er klare. Velg ønsket installasjonsfil.');
        else if(apk)message('APK-en er klar. ZIP-pakken blir tilgjengelig etter neste vellykkede bygg.');
        else if(zip)message('ZIP-pakken er klar. Pakk ut og åpne APK-filen for å installere.');
        else message('Appfilene bygges eller venter på publisering. Nedlastingsknappene aktiveres når filene finnes.');
      })
      .catch(function(){
        controls(zipButtons,false);
        controls(apkButtons,false);
        message('Kunne ikke bekrefte nedlastingsstatus. Prøv å oppdatere nettsiden.');
      })
      .finally(function(){checking=false;});
  }
  checkAvailability();
  document.addEventListener('visibilitychange',function(){if(!document.hidden)checkAvailability();});
})();

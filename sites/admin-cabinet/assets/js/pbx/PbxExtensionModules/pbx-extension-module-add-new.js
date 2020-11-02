"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global UserMessage, globalTranslate, PbxApi, upgradeStatusLoopWorker */
var addNewExtension = {
  $uploadButton: $('#add-new-button'),
  $progressBar: $('#upload-progress-bar'),
  $progressBarLabel: $('#upload-progress-bar').find('.label'),
  uploadInProgress: false,
  initialize: function () {
    function initialize() {
      addNewExtension.$progressBar.hide();
      PbxApi.SystemUploadFileAttachToBtn('add-new-button', ['zip'], addNewExtension.cbResumableUploadFile);
    }

    return initialize;
  }(),

  /**
   * Upload file by chunks
   * @param action
   * @param params
   */
  cbResumableUploadFile: function () {
    function cbResumableUploadFile(action, params) {
      switch (action) {
        case 'fileSuccess':
          addNewExtension.checkStatusFileMerging(params.response);
          break;

        case 'uploadStart':
          addNewExtension.uploadInProgress = true;
          addNewExtension.$uploadButton.addClass('loading');
          addNewExtension.$progressBar.show();
          addNewExtension.$progressBarLabel.text(globalTranslate.ext_UploadInProgress);
          break;

        case 'progress':
          addNewExtension.$progressBar.progress({
            percent: parseInt(params.percent, 10)
          });
          break;

        case 'error':
          addNewExtension.$progressBarLabel.text(globalTranslate.ext_UploadError);
          addNewExtension.$uploadButton.removeClass('loading');
          UserMessage.showMultiString(globalTranslate.ext_UploadError);
          break;

        default:
      }
    }

    return cbResumableUploadFile;
  }(),

  /**
   * Wait for file ready to use
   *
   * @param response ответ функции /pbxcore/api/upload/status
   */
  checkStatusFileMerging: function () {
    function checkStatusFileMerging(response) {
      if (response === undefined || PbxApi.tryParseJSON(response) === false) {
        UserMessage.showMultiString("".concat(globalTranslate.ext_UploadError));
        return;
      }

      var json = JSON.parse(response);

      if (json === undefined || json.data === undefined) {
        UserMessage.showMultiString("".concat(globalTranslate.ext_UploadError));
        return;
      }

      var fileID = json.data.upload_id;
      var filePath = json.data.filename;
      mergingCheckWorker.initialize(fileID, filePath);
    }

    return checkStatusFileMerging;
  }()
};
var mergingCheckWorker = {
  timeOut: 3000,
  timeOutHandle: '',
  errorCounts: 0,
  $progressBarLabel: $('#upload-progress-bar').find('.label'),
  fileID: null,
  filePath: '',
  initialize: function () {
    function initialize(fileID, filePath) {
      // Запустим обновление статуса провайдера
      mergingCheckWorker.fileID = fileID;
      mergingCheckWorker.filePath = filePath;
      mergingCheckWorker.restartWorker(fileID);
    }

    return initialize;
  }(),
  restartWorker: function () {
    function restartWorker() {
      window.clearTimeout(mergingCheckWorker.timeoutHandle);
      mergingCheckWorker.worker();
    }

    return restartWorker;
  }(),
  worker: function () {
    function worker() {
      PbxApi.FilesGetStatusUploadFile(mergingCheckWorker.fileID, mergingCheckWorker.cbAfterResponse);
      mergingCheckWorker.timeoutHandle = window.setTimeout(mergingCheckWorker.worker, mergingCheckWorker.timeOut);
    }

    return worker;
  }(),
  cbAfterResponse: function () {
    function cbAfterResponse(response) {
      if (mergingCheckWorker.errorCounts > 10) {
        mergingCheckWorker.$progressBarLabel.text(globalTranslate.ext_UploadError);
        UserMessage.showMultiString(response, globalTranslate.ext_UploadError);
        addNewExtension.$uploadButton.removeClass('loading');
        window.clearTimeout(mergingCheckWorker.timeoutHandle);
      }

      if (response === undefined || Object.keys(response).length === 0) {
        mergingCheckWorker.errorCounts += 1;
        return;
      }

      if (response.d_status === 'UPLOAD_COMPLETE') {
        mergingCheckWorker.$progressBarLabel.text(globalTranslate.ext_InstallationInProgress);
        PbxApi.SystemInstallModule(mergingCheckWorker.filePath, mergingCheckWorker.cbAfterModuleInstall);
        window.clearTimeout(mergingCheckWorker.timeoutHandle);
      } else if (response.d_status !== undefined) {
        mergingCheckWorker.$progressBarLabel.text(globalTranslate.ext_UploadInProgress);
        mergingCheckWorker.errorCounts = 0;
      } else {
        mergingCheckWorker.errorCounts += 1;
      }
    }

    return cbAfterResponse;
  }(),
  cbAfterModuleInstall: function () {
    function cbAfterModuleInstall(response) {
      if (response === true) {
        window.location.reload();
      } else {
        UserMessage.showMultiString(response, globalTranslate.ext_InstallationError);
        addNewExtension.$uploadButton.removeClass('loading');
      }
    }

    return cbAfterModuleInstall;
  }()
};
$(document).ready(function () {
  addNewExtension.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9QYnhFeHRlbnNpb25Nb2R1bGVzL3BieC1leHRlbnNpb24tbW9kdWxlLWFkZC1uZXcuanMiXSwibmFtZXMiOlsiYWRkTmV3RXh0ZW5zaW9uIiwiJHVwbG9hZEJ1dHRvbiIsIiQiLCIkcHJvZ3Jlc3NCYXIiLCIkcHJvZ3Jlc3NCYXJMYWJlbCIsImZpbmQiLCJ1cGxvYWRJblByb2dyZXNzIiwiaW5pdGlhbGl6ZSIsImhpZGUiLCJQYnhBcGkiLCJTeXN0ZW1VcGxvYWRGaWxlQXR0YWNoVG9CdG4iLCJjYlJlc3VtYWJsZVVwbG9hZEZpbGUiLCJhY3Rpb24iLCJwYXJhbXMiLCJjaGVja1N0YXR1c0ZpbGVNZXJnaW5nIiwicmVzcG9uc2UiLCJhZGRDbGFzcyIsInNob3ciLCJ0ZXh0IiwiZ2xvYmFsVHJhbnNsYXRlIiwiZXh0X1VwbG9hZEluUHJvZ3Jlc3MiLCJwcm9ncmVzcyIsInBlcmNlbnQiLCJwYXJzZUludCIsImV4dF9VcGxvYWRFcnJvciIsInJlbW92ZUNsYXNzIiwiVXNlck1lc3NhZ2UiLCJzaG93TXVsdGlTdHJpbmciLCJ1bmRlZmluZWQiLCJ0cnlQYXJzZUpTT04iLCJqc29uIiwiSlNPTiIsInBhcnNlIiwiZGF0YSIsImZpbGVJRCIsInVwbG9hZF9pZCIsImZpbGVQYXRoIiwiZmlsZW5hbWUiLCJtZXJnaW5nQ2hlY2tXb3JrZXIiLCJ0aW1lT3V0IiwidGltZU91dEhhbmRsZSIsImVycm9yQ291bnRzIiwicmVzdGFydFdvcmtlciIsIndpbmRvdyIsImNsZWFyVGltZW91dCIsInRpbWVvdXRIYW5kbGUiLCJ3b3JrZXIiLCJGaWxlc0dldFN0YXR1c1VwbG9hZEZpbGUiLCJjYkFmdGVyUmVzcG9uc2UiLCJzZXRUaW1lb3V0IiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsImRfc3RhdHVzIiwiZXh0X0luc3RhbGxhdGlvbkluUHJvZ3Jlc3MiLCJTeXN0ZW1JbnN0YWxsTW9kdWxlIiwiY2JBZnRlck1vZHVsZUluc3RhbGwiLCJsb2NhdGlvbiIs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R0E7QUFDTkgsUUFBQUEsa0JBQWtCLENBQUNHLFdBQW5CLElBQWtDLENBQWxDO0FBQ0E7QUFDRDs7QUE3Q3lCO0FBQUE7QUE4QzFCZSxFQUFBQSxvQkE5QzBCO0FBQUEsa0NBOENMekMsUUE5Q0ssRUE4Q0k7QUFDN0IsVUFBSUEsUUFBUSxLQUFHLElBQWYsRUFBb0I7QUFDbkI0QixRQUFBQSxNQUFNLENBQUNjLFFBQVAsQ0FBZ0JDLE1BQWhCO0FBQ0EsT0FGRCxNQUVPO0FBQ05oQyxRQUFBQSxXQUFXLENBQUNDLGVBQVosQ0FBNEJaLFFBQTVCLEVBQXNDSSxlQUFlLENBQUN3QyxxQkFBdEQ7QUFDQTNELFFBQUFBLGVBQWUsQ0FBQ0MsYUFBaEIsQ0FBOEJ3QixXQUE5QixDQUEwQyxTQUExQztBQUNBO0FBQ0Q7O0FBckR5QjtBQUFBO0FBQUEsQ0FBM0I7QUF3REF2QixDQUFDLENBQUMwRCxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3ZCN0QsRUFBQUEsZUFBZSxDQUFDTyxVQUFoQjtBQUNBLENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChDKSBNSUtPIExMQyAtIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqIFVuYXV0aG9yaXplZCBjb3B5aW5nIG9mIHRoaXMgZmlsZSwgdmlhIGFueSBtZWRpdW0gaXMgc3RyaWN0bHkgcHJvaGliaXRlZFxuICogUHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbFxuICogV3JpdHRlbiBieSBOaWtvbGF5IEJla2V0b3YsIDEyIDIwMTlcbiAqXG4gKi9cblxuLyogZ2xvYmFsIFVzZXJNZXNzYWdlLCBnbG9iYWxUcmFuc2xhdGUsIFBieEFwaSwgdXBncmFkZVN0YXR1c0xvb3BXb3JrZXIgKi8gXG5cbmNvbnN0IGFkZE5ld0V4dGVuc2lvbiA9IHtcblx0JHVwbG9hZEJ1dHRvbjogJCgnI2FkZC1uZXctYnV0dG9uJyksXG5cdCRwcm9ncmVzc0JhcjogJCgnI3VwbG9hZC1wcm9ncmVzcy1iYXInKSxcblx0JHByb2dyZXNzQmFyTGFiZWw6ICQoJyN1cGxvYWQtcHJvZ3Jlc3MtYmFyJykuZmluZCgnLmxhYmVsJyksXG5cdHVwbG9hZEluUHJvZ3Jlc3M6IGZhbHNlLFxuXHRpbml0aWFsaXplKCkge1xuXHRcdGFkZE5ld0V4dGVuc2lvbi4kcHJvZ3Jlc3NCYXIuaGlkZSgpO1xuXHRcdFBieEFwaS5TeXN0ZW1VcGxvYWRGaWxlQXR0YWNoVG9CdG4oJ2FkZC1uZXctYnV0dG9uJyxbJ3ppcCddLCBhZGROZXdFeHRlbnNpb24uY2JSZXN1bWFibGVVcGxvYWRGaWxlKTtcblx0fSxcblx0LyoqXG5cdCAqIFVwbG9hZCBmaWxlIGJ5IGNodW5rc1xuXHQgKiBAcGFyYW0gYWN0aW9uXG5cdCAqIEBwYXJhbSBwYXJhbXNcblx0ICovXG5cdGNiUmVzdW1hYmxlVXBsb2FkRmlsZShhY3Rpb24sIHBhcmFtcyl7XG5cdFx0c3dpdGNoIChhY3Rpb24pIHtcblx0XHRcdGNhc2UgJ2ZpbGVTdWNjZXNzJzpcblx0XHRcdFx0YWRkTmV3RXh0ZW5zaW9uLmNoZWNrU3RhdHVzRmlsZU1lcmdpbmcocGFyYW1zLnJlc3BvbnNlKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICd1cGxvYWRTdGFydCc6XG5cdFx0XHRcdGFkZE5ld0V4dGVuc2lvbi51cGxvYWRJblByb2dyZXNzID0gdHJ1ZTtcblx0XHRcdFx0YWRkTmV3RXh0ZW5zaW9uLiR1cGxvYWRCdXR0b24uYWRkQ2xhc3MoJ2xvYWRpbmcnKTtcblx0XHRcdFx0YWRkTmV3RXh0ZW5zaW9uLiRwcm9ncmVzc0Jhci5zaG93KCk7XG5cdFx0XHRcdGFkZE5ld0V4dGVuc2lvbi4kcHJvZ3Jlc3NCYXJMYWJlbC50ZXh0KGdsb2JhbFRyYW5zbGF0ZS5leHRfVXBsb2FkSW5Qcm9ncmVzcyk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAncHJvZ3Jlc3MnOlxuXHRcdFx0XHRhZGROZXdFeHRlbnNpb24uJHByb2dyZXNzQmFyLnByb2dyZXNzKHtcblx0XHRcdFx0XHRwZXJjZW50OiBwYXJzZUludChwYXJhbXMucGVyY2VudCwgMTApLFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdlcnJvcic6XG5cdFx0XHRcdGFkZE5ld0V4dGVuc2lvbi4kcHJvZ3Jlc3NCYXJMYWJlbC50ZXh0KGdsb2JhbFRyYW5zbGF0ZS5leHRfVXBsb2FkRXJyb3IpO1xuXHRcdFx0XHRhZGROZXdFeHRlbnNpb24uJHVwbG9hZEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZycpO1xuXHRcdFx0XHRVc2VyTWVzc2FnZS5zaG93TXVsdGlTdHJpbmcoZ2xvYmFsVHJhbnNsYXRlLmV4dF9VcGxvYWRFcnJvcik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBXYWl0IGZvciBmaWxlIHJlYWR5IHRvIHVzZVxuXHQgKlxuXHQgKiBAcGFyYW0gcmVzcG9uc2Ug0L7RgtCy0LXRgiDRhNGD0L3QutGG0LjQuCAvcGJ4Y29yZS9hcGkvdXBsb2FkL3N0YXR1c1xuXHQgKi9cblx0Y2hlY2tTdGF0dXNGaWxlTWVyZ2luZyhyZXNwb25zZSkge1xuXHRcdGlmIChyZXNwb25zZSA9PT0gdW5kZWZpbmVkIHx8IFBieEFwaS50cnlQYXJzZUpTT04ocmVzcG9uc2UpID09PSBmYWxzZSkge1xuXHRcdFx0VXNlck1lc3NhZ2Uuc2hvd011bHRpU3RyaW5nKGAke2dsb2JhbFRyYW5zbGF0ZS5leHRfVXBsb2FkRXJyb3J9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlKTtcblx0XHRpZiAoanNvbiA9PT0gdW5kZWZpbmVkIHx8IGpzb24uZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRVc2VyTWVzc2FnZS5zaG93TXVsdGlTdHJpbmcoYCR7Z2xvYmFsVHJhbnNsYXRlLmV4dF9VcGxvYWRFcnJvcn1gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Y29uc3QgZmlsZUlEID0ganNvbi5kYXRhLnVwbG9hZF9pZDtcblx0XHRjb25zdCBmaWxlUGF0aCA9IGpzb24uZGF0YS5maWxlbmFtZTtcblx0XHRtZXJnaW5nQ2hlY2tXb3JrZXIuaW5pdGlhbGl6ZShmaWxlSUQsIGZpbGVQYXRoKTtcblx0fSxcblxufTtcblxuY29uc3QgbWVyZ2luZ0NoZWNrV29ya2VyID0ge1xuXHR0aW1lT3V0OiAzMDAwLFxuXHR0aW1lT3V0SGFuZGxlOiAnJyxcblx0ZXJyb3JDb3VudHM6IDAsXG5cdCRwcm9ncmVzc0JhckxhYmVsOiAkKCcjdXBsb2FkLXByb2dyZXNzLWJhcicpLmZpbmQoJy5sYWJlbCcpLFxuXHRmaWxlSUQ6IG51bGwsXG5cdGZpbGVQYXRoOiAnJyxcblx0aW5pdGlhbGl6ZShmaWxlSUQsIGZpbGVQYXRoKSB7XG5cdFx0Ly8g0JfQsNC/0YPRgdGC0LjQvCDQvtCx0L3QvtCy0LvQtdC90LjQtSDRgdGC0LDRgtGD0YHQsCDQv9GA0L7QstCw0LnQtNC10YDQsFxuXHRcdG1lcmdpbmdDaGVja1dvcmtlci5maWxlSUQgPSBmaWxlSUQ7XG5cdFx0bWVyZ2luZ0NoZWNrV29ya2VyLmZpbGVQYXRoID0gZmlsZVBhdGg7XG5cdFx0bWVyZ2luZ0NoZWNrV29ya2VyLnJlc3RhcnRXb3JrZXIoZmlsZUlEKTtcblx0fSxcblx0cmVzdGFydFdvcmtlcigpIHtcblx0XHR3aW5kb3cuY2xlYXJUaW1lb3V0KG1lcmdpbmdDaGVja1dvcmtlci50aW1lb3V0SGFuZGxlKTtcblx0XHRtZXJnaW5nQ2hlY2tXb3JrZXIud29ya2VyKCk7XG5cdH0sXG5cdHdvcmtlcigpIHtcblx0XHRQYnhBcGkuRmlsZXNHZXRTdGF0dXNVcGxvYWRGaWxlKG1lcmdpbmdDaGVja1dvcmtlci5maWxlSUQsIG1lcmdpbmdDaGVja1dvcmtlci5jYkFmdGVyUmVzcG9uc2UpO1xuXHRcdG1lcmdpbmdDaGVja1dvcmtlci50aW1lb3V0SGFuZGxlID0gd2luZG93LnNldFRpbWVvdXQoXG5cdFx0XHRtZXJnaW5nQ2hlY2tXb3JrZXIud29ya2VyLFxuXHRcdFx0bWVyZ2luZ0NoZWNrV29ya2VyLnRpbWVPdXQsXG5cdFx0KTtcblx0fSxcblx0Y2JBZnRlclJlc3BvbnNlKHJlc3BvbnNlKSB7XG5cdFx0aWYgKG1lcmdpbmdDaGVja1dvcmtlci5lcnJvckNvdW50cyA+IDEwKSB7XG5cdFx0XHRtZXJnaW5nQ2hlY2tXb3JrZXIuJHByb2dyZXNzQmFyTGFiZWwudGV4dChnbG9iYWxUcmFuc2xhdGUuZXh0X1VwbG9hZEVycm9yKTtcblx0XHRcdFVzZXJNZXNzYWdlLnNob3dNdWx0aVN0cmluZyhyZXNwb25zZSwgZ2xvYmFsVHJhbnNsYXRlLmV4dF9VcGxvYWRFcnJvcik7XG5cdFx0XHRhZGROZXdFeHRlbnNpb24uJHVwbG9hZEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZycpO1xuXHRcdFx0d2luZG93LmNsZWFyVGltZW91dChtZXJnaW5nQ2hlY2tXb3JrZXIudGltZW91dEhhbmRsZSk7XG5cdFx0fVxuXHRcdGlmIChyZXNwb25zZSA9PT0gdW5kZWZpbmVkIHx8IE9iamVjdC5rZXlzKHJlc3BvbnNlKS5sZW5ndGggPT09IDApIHtcblx0XHRcdG1lcmdpbmdDaGVja1dvcmtlci5lcnJvckNvdW50cyArPSAxO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAocmVzcG9uc2UuZF9zdGF0dXMgPT09ICdVUExPQURfQ09NUExFVEUnKSB7XG5cdFx0XHRtZXJnaW5nQ2hlY2tXb3JrZXIuJHByb2dyZXNzQmFyTGFiZWwudGV4dChnbG9iYWxUcmFuc2xhdGUuZXh0X0luc3RhbGxhdGlvbkluUHJvZ3Jlc3MpO1xuXHRcdFx0UGJ4QXBpLlN5c3RlbUluc3RhbGxNb2R1bGUobWVyZ2luZ0NoZWNrV29ya2VyLmZpbGVQYXRoLCBtZXJnaW5nQ2hlY2tXb3JrZXIuY2JBZnRlck1vZHVsZUluc3RhbGwpO1xuXHRcdFx0d2luZG93LmNsZWFyVGltZW91dChtZXJnaW5nQ2hlY2tXb3JrZXIudGltZW91dEhhbmRsZSk7XG5cdFx0fSBlbHNlIGlmIChyZXNwb25zZS5kX3N0YXR1cyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRtZXJnaW5nQ2hlY2tXb3JrZXIuJHByb2dyZXNzQmFyTGFiZWwudGV4dChnbG9iYWxUcmFuc2xhdGUuZXh0X1VwbG9hZEluUHJvZ3Jlc3MpO1xuXHRcdFx0bWVyZ2luZ0NoZWNrV29ya2VyLmVycm9yQ291bnRzID0gMDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWVyZ2luZ0NoZWNrV29ya2VyLmVycm9yQ291bnRzICs9IDE7XG5cdFx0fVxuXHR9LFxuXHRjYkFmdGVyTW9kdWxlSW5zdGFsbChyZXNwb25zZSl7XG5cdFx0aWYgKHJlc3BvbnNlPT09dHJ1ZSl7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdFVzZXJNZXNzYWdlLnNob3dNdWx0aVN0cmluZyhyZXNwb25zZSwgZ2xvYmFsVHJhbnNsYXRlLmV4dF9JbnN0YWxsYXRpb25FcnJvcik7XG5cdFx0XHRhZGROZXdFeHRlbnNpb24uJHVwbG9hZEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZycpO1xuXHRcdH1cblx0fSxcbn07XG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcblx0YWRkTmV3RXh0ZW5zaW9uLmluaXRpYWxpemUoKTtcbn0pO1xuIl19
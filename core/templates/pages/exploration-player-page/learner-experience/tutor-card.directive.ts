// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Controller for the Tutor Card.
 */

require('directives/angular-html-bind.directive.ts');
require(
  'pages/exploration-player-page/layout-directives/audio-bar.directive.ts');
require(
  'pages/exploration-player-page/learner-experience/' +
  'input-response-pair.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/audio-preloader.service.ts');
require(
  'pages/exploration-player-page/services/' +
  'audio-translation-manager.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require(
  'pages/exploration-player-page/services/exploration-player-state.service.ts');
require(
  'pages/exploration-player-page/services/learner-answer-info.service.ts');
require('pages/exploration-player-page/exploration-player-page.constants.ts');
require('pages/exploration-player-page/services/player-position.service.ts');
require('services/audio-bar-status.service.ts');
require('services/audio-player.service.ts');
require('services/autogenerated-audio-player.service.ts');
require('services/context.service.ts');
require('services/user.service.ts');
require('services/contextual/device-info.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');

require(
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/layout-directives/content-language-selector.component.ts');
require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').animation(
  '.conversation-skin-responses-animate-slide', function() {
    return {
      removeClass: function(element, className, done) {
        if (className !== 'ng-hide') {
          done();
          return;
        }
        element.hide().slideDown(400, <(this: HTMLElement) => void>done);
      },
      addClass: function(element, className, done) {
        if (className !== 'ng-hide') {
          done();
          return;
        }
        element.slideUp(400, <(this: HTMLElement) => void>done);
      }
    };
  });

angular.module('oppia').directive('tutorCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isLearnAgainButton: '&',
        onDismiss: '&',
        getDisplayedCard: '&displayedCard',
        startCardChangeAnimation: '=',
        isAvatarImageShown: '&avatarImageIsShown'
      },
      template: require('./tutor-card.directive.html'),
      controller: [
        '$anchorScroll', '$location', '$rootScope', '$scope',
        'AudioBarStatusService', 'AudioPlayerService', 'AudioPreloaderService',
        'AudioTranslationManagerService', 'AutogeneratedAudioPlayerService',
        'ContextService', 'CurrentInteractionService', 'DeviceInfoService',
        'ExplorationPlayerStateService', 'LearnerAnswerInfoService',
        'PlayerPositionService', 'UrlService', 'UserService',
        'WindowDimensionsService', 'AUDIO_HIGHLIGHT_CSS_CLASS',
        'COMPONENT_NAME_CONTENT', 'CONTENT_FOCUS_LABEL_PREFIX',
        'DEFAULT_PROFILE_IMAGE_PATH', 'OPPIA_AVATAR_LINK_URL',
        'TWO_CARD_THRESHOLD_PX',
        function(
            $anchorScroll, $location, $rootScope, $scope,
            AudioBarStatusService, AudioPlayerService, AudioPreloaderService,
            AudioTranslationManagerService, AutogeneratedAudioPlayerService,
            ContextService, CurrentInteractionService, DeviceInfoService,
            ExplorationPlayerStateService, LearnerAnswerInfoService,
            PlayerPositionService, UrlService, UserService,
            WindowDimensionsService, AUDIO_HIGHLIGHT_CSS_CLASS,
            COMPONENT_NAME_CONTENT, CONTENT_FOCUS_LABEL_PREFIX,
            DEFAULT_PROFILE_IMAGE_PATH, OPPIA_AVATAR_LINK_URL,
            TWO_CARD_THRESHOLD_PX) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var _editorPreviewMode = ContextService.isInExplorationEditorPage();
          var updateDisplayedCard = function() {
            $scope.arePreviousResponsesShown = false;
            $scope.lastAnswer = null;
            $scope.conceptCardIsBeingShown = Boolean(
              !$scope.getDisplayedCard().getInteraction());
            $scope.interactionIsActive =
              !$scope.getDisplayedCard().isCompleted();
            ctrl.directiveSubscriptions.add(
              PlayerPositionService.onNewCardAvailable.subscribe(
                (unusedData) => $scope.interactionIsActive = false
              )
            );
            CurrentInteractionService.registerPresubmitHook(function() {
              $scope.waitingForOppiaFeedback = true;
            });
            if (!$scope.interactionIsActive) {
              $scope.lastAnswer = $scope.getDisplayedCard().getLastAnswer();
            }
            if (!$scope.conceptCardIsBeingShown) {
              $scope.interactionInstructions = (
                $scope.getDisplayedCard().getInteractionInstructions());
              $scope.contentAudioTranslations = (
                $scope.getDisplayedCard().getVoiceovers());
              AudioTranslationManagerService
                .clearSecondaryAudioTranslations();
              AudioTranslationManagerService.setContentAudioTranslations(
                angular.copy($scope.contentAudioTranslations),
                $scope.getDisplayedCard().getContentHtml(),
                COMPONENT_NAME_CONTENT);
              AudioPlayerService.stop();
              AudioPreloaderService.clearMostRecentlyRequestedAudioFilename();
              AutogeneratedAudioPlayerService.cancel();
            }
          };

          $scope.isInteractionInline = function() {
            if ($scope.conceptCardIsBeingShown) {
              return true;
            }
            return $scope.getDisplayedCard().isInteractionInline();
          };

          $scope.getContentAudioHighlightClass = function() {
            if (AudioTranslationManagerService
              .getCurrentComponentName() ===
              COMPONENT_NAME_CONTENT &&
              (AudioPlayerService.isPlaying() ||
              AutogeneratedAudioPlayerService.isPlaying())) {
              return AUDIO_HIGHLIGHT_CSS_CLASS;
            }
          };

          $scope.getContentFocusLabel = function(index) {
            return CONTENT_FOCUS_LABEL_PREFIX + index;
          };

          $scope.toggleShowPreviousResponses = function() {
            $scope.arePreviousResponsesShown =
              !$scope.arePreviousResponsesShown;
          };

          $scope.isWindowNarrow = function() {
            return WindowDimensionsService.isWindowNarrow();
          };

          $scope.canWindowShowTwoCards = function() {
            return WindowDimensionsService.getWidth() > TWO_CARD_THRESHOLD_PX;
          };

          $scope.showAudioBar = function() {
            return (
              !$scope.isIframed &&
              !ExplorationPlayerStateService.isInQuestionMode());
          };

          $scope.isContentAudioTranslationAvailable = function() {
            if ($scope.conceptCardIsBeingShown) {
              return false;
            }
            return (
              $scope.getDisplayedCard().isContentAudioTranslationAvailable());
          };

          $scope.isCurrentCardAtEndOfTranscript = function() {
            return !$scope.getDisplayedCard().isCompleted();
          };

          $scope.isOnTerminalCard = function() {
            return (
              $scope.getDisplayedCard().isTerminal());
          };

          $scope.getInputResponsePairId = function(index) {
            return 'input-response-pair-' + index;
          };
          ctrl.$onInit = function() {
            $scope.arePreviousResponsesShown = false;
            $scope.waitingForOppiaFeedback = false;
            $scope.windowDimensionsService = WindowDimensionsService;
            $scope.isIframed = UrlService.isIframed();
            $scope.isAudioBarExpandedOnMobileDevice = function() {
              return (
                DeviceInfoService.isMobileDevice() &&
                AudioBarStatusService.isAudioBarExpanded()
              );
            };
            $scope.getCanAskLearnerForAnswerInfo = (
              LearnerAnswerInfoService.getCanAskLearnerForAnswerInfo);

            $scope.OPPIA_AVATAR_IMAGE_URL = (
              UrlInterpolationService.getStaticImageUrl(
                '/avatar/oppia_avatar_100px.svg'));
            $scope.OPPIA_AVATAR_LINK_URL = OPPIA_AVATAR_LINK_URL;

            $scope.profilePicture = UrlInterpolationService.getStaticImageUrl(
              '/avatar/user_blue_72px.png');

            if (!_editorPreviewMode) {
              UserService.getProfileImageDataUrlAsync()
                .then(function(dataUrl) {
                  $scope.profilePicture = dataUrl;
                  // TODO(#8521): Remove the use of $rootScope.$apply()
                  // once the controller is migrated to angular.
                  $rootScope.$applyAsync();
                });
            } else {
              $scope.profilePicture = (
                UrlInterpolationService.getStaticImageUrl(
                  DEFAULT_PROFILE_IMAGE_PATH));
            }

            ctrl.directiveSubscriptions.add(
              PlayerPositionService.onActiveCardChanged.subscribe(
                () => {
                  updateDisplayedCard();
                }
              )
            );

            ctrl.directiveSubscriptions.add(
              ExplorationPlayerStateService.onOppiaFeedbackAvailable.subscribe(
                () => {
                  $scope.waitingForOppiaFeedback = false;

                  // Auto scroll to the new feedback on mobile device.
                  if (DeviceInfoService.isMobileDevice()) {
                    var latestFeedbackIndex = (
                      $scope.getDisplayedCard()
                        .getInputResponsePairs().length - 1);
                    /* Reference: https://stackoverflow.com/questions/40134381
                      $anchorScroll() without changing actual hash value of url
                      works only when written inside a timeout of 0 ms. */
                    $anchorScroll.yOffset = 80;
                    $location.hash(
                      $scope.getInputResponsePairId(latestFeedbackIndex));
                    $anchorScroll();
                  }
                })
            );
            updateDisplayedCard();
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }
]);

package com.dulich.platform.service;

import com.dulich.platform.repository.DeviceTokenRepository;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FCMService {

    private final DeviceTokenRepository deviceTokenRepo;

    public void sendPush(Long userId, String title, String body, Map<String, String> data) {
        var tokens = deviceTokenRepo.findByUserId(userId);
        if (tokens.isEmpty()) {
            log.debug("No device tokens for userId={}, skipping push", userId);
            return;
        }

        for (var deviceToken : tokens) {
            try {
                Message message = Message.builder()
                        .setToken(deviceToken.getToken())
                        .setAndroidConfig(AndroidConfig.builder()
                                .setPriority(AndroidConfig.Priority.HIGH)
                                .setNotification(AndroidNotification.builder()
                                        .setTitle(title)
                                        .setBody(body)
                                        .setIcon("ic_notification")
                                        .setColor("#0f766e")
                                        .setSound("default")
                                        .setChannelId("dulich_bookings")
                                        .build())
                                .build())
                        .putAllData(data)
                        .build();

                String response = FirebaseMessaging.getInstance().send(message);
                log.info("FCM sent to userId={}, token={}..., response={}",
                        userId, deviceToken.getToken().substring(0, 20), response);
            } catch (Exception e) {
                log.warn("FCM send failed for token={}: {}",
                        deviceToken.getToken().substring(0, 20), e.getMessage());
                // TODO: Remove invalid tokens (UNREGISTERED error)
            }
        }
    }
}

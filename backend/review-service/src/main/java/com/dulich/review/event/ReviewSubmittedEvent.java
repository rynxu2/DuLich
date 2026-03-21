package com.dulich.review.event;

import lombok.*;
import java.io.Serializable;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewSubmittedEvent implements Serializable {
    private Long reviewId;
    private Long tourId;
    private Long userId;
    private BigDecimal rating;
}

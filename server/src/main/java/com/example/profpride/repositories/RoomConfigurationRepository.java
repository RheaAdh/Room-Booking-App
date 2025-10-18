package com.example.profpride.repositories;

import com.example.profpride.models.RoomConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomConfigurationRepository extends JpaRepository<RoomConfiguration, Long> {
    
    List<RoomConfiguration> findByRoomId(Long roomId);
    
    List<RoomConfiguration> findByRoomIdAndIsAvailableTrue(Long roomId);
    
    List<RoomConfiguration> findByPersonCountAndIsAvailableTrue(Integer personCount);
    
    RoomConfiguration findByRoomIdAndPersonCount(Long roomId, Integer personCount);
}

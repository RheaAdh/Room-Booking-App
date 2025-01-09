package com.example.profpride.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.profpride.models.RoomCost;
import com.example.profpride.repositories.RoomCostRepository;
import java.util.List;

@Service
public class RoomCostService {

    @Autowired
    private final RoomCostRepository roomCostRepository;

    public RoomCostService(RoomCostRepository roomCostRepository) {
        this.roomCostRepository = roomCostRepository;
    }

    public List<RoomCost> getAllRoomCosts() {
        return roomCostRepository.findAll();
    }

    public RoomCost getRoomCostById(Long id) {
        return roomCostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RoomCost not found with id: " + id));
    }

    public RoomCost createRoomCost(RoomCost roomCost) {
        System.out.println(roomCost.toString());
        return roomCostRepository.save(roomCost);
    }

    public RoomCost updateRoomCost(Long id, RoomCost roomCostDetails) {
        RoomCost roomCost = getRoomCostById(id);
        roomCost.setBathroomType(roomCostDetails.getBathroomType());
        roomCost.setRoomType(roomCostDetails.getRoomType());
        roomCost.setBookingDurationType(roomCostDetails.getBookingDurationType());
        roomCost.setCost(roomCostDetails.getCost());
        return roomCostRepository.save(roomCost);
    }

    public void deleteRoomCost(Long id) {
        RoomCost roomCost = getRoomCostById(id);
        roomCostRepository.delete(roomCost);
    }
}

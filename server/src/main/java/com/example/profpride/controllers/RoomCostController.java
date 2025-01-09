package com.example.profpride.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.profpride.models.RoomCost;
import com.example.profpride.services.RoomCostService;

@RestController
@RequestMapping("/api/v1/roomcost")
public class RoomCostController {

    @Autowired
    private final RoomCostService roomCostService;

    public RoomCostController(RoomCostService roomCostService) {
        this.roomCostService = roomCostService;
    }

    @GetMapping
    public List<RoomCost> getAllRoomCosts() {
        return roomCostService.getAllRoomCosts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomCost> getRoomCostById(@PathVariable Long id) {
        RoomCost roomCost = roomCostService.getRoomCostById(id);
        return ResponseEntity.ok(roomCost);
    }

    @PostMapping
    public ResponseEntity<RoomCost> createRoomCost(@RequestBody RoomCost roomCost) {
        RoomCost createdRoomCost = roomCostService.createRoomCost(roomCost);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRoomCost);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoomCost> updateRoomCost(@PathVariable Long id, @RequestBody RoomCost roomCost) {
        RoomCost updatedRoomCost = roomCostService.updateRoomCost(id, roomCost);
        return ResponseEntity.ok(updatedRoomCost);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoomCost(@PathVariable Long id) {
        roomCostService.deleteRoomCost(id);
        return ResponseEntity.noContent().build();
    }
}

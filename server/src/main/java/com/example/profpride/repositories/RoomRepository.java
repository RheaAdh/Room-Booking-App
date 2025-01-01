package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.profpride.models.Room;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

}
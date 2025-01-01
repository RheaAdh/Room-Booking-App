package com.example.profpride.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.profpride.repositories.RoomRepository;

@Service
public class RoomService {
    @Autowired
    private RoomRepository roomRepository;

}

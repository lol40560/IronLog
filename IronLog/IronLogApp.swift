//
//  IronLogApp.swift
//  IronLog
//
//  Created by Quentin Chih on 2026/9/7.
//

import SwiftUI
import SwiftData

@main
struct IronLogApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Workout.self, WorkoutExercise.self, WorkoutSet.self, TrainingSession.self, TrainingRoutine.self, EquipmentMemory.self])
    }
}

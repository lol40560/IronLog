import SwiftUI
import HealthKit
import Observation

struct HealthMetric: Identifiable {
    let id: String
    let title: String
    let value: String
    let unit: String
    let icon: String
    let detail: String
}
@Observable @MainActor final class HealthSummary {
    private let store = HKHealthStore()
    var requested = UserDefaults.standard.bool(forKey: "healthRequested")
    var advanced = UserDefaults.standard.bool(forKey: "healthAdvanced")
    var loading = false
    var error: String?
    var steps: Double?
    var metrics: [HealthMetric] = []
    var updated: Date?
    var available: Bool { HKHealthStore.isHealthDataAvailable() }
    private let basic: [HKQuantityTypeIdentifier] = [.stepCount, .distanceWalkingRunning, .activeEnergyBurned, .bodyMass]
    private let extra: [HKQuantityTypeIdentifier] = [.heartRate, .restingHeartRate, .heartRateVariabilitySDNN, .appleExerciseTime, .appleStandTime, .vo2Max, .respiratoryRate, .oxygenSaturation, .appleSleepingWristTemperature, .bodyFatPercentage]

    func connect(includeAdvanced: Bool) async {
        guard available, !loading else { return }
        loading = true; error = nil
        var types = Set<HKObjectType>((basic + (includeAdvanced || advanced ? extra : [])).compactMap { HKQuantityType.quantityType(forIdentifier: $0) })
        if includeAdvanced || advanced { types.insert(HKCategoryType(.sleepAnalysis)) }
        do {
            try await store.requestAuthorization(toShare: [], read: types)
            requested = true; advanced = advanced || includeAdvanced
            UserDefaults.standard.set(true, forKey: "healthRequested")
            UserDefaults.standard.set(advanced, forKey: "healthAdvanced")
        } catch { self.error = error.localizedDescription }
        loading = false
        if requested { await refresh() }
    }
    func refresh() async {
        guard available, requested, !loading else { return }
        loading = true; error = nil
        var result: [HealthMetric] = []
        let specs: [(HKQuantityTypeIdentifier, String, HKUnit, String, String, Bool)] = [
            (.stepCount, "今日步數", .count(), "步", "figure.walk", true),
            (.distanceWalkingRunning, "步行與跑步", .meterUnit(with: .kilo), "km", "point.topleft.down.to.point.bottomright.curvepath", true),
            (.activeEnergyBurned, "活動能量", .kilocalorie(), "kcal", "flame.fill", true),
            (.bodyMass, "體重", .gramUnit(with: .kilo), "kg", "scalemass", false),
            (.heartRate, "心率", HKUnit.count().unitDivided(by: .minute()), "bpm", "heart.fill", false),
            (.restingHeartRate, "靜息心率", HKUnit.count().unitDivided(by: .minute()), "bpm", "heart", false),
            (.heartRateVariabilitySDNN, "心率變異度", .secondUnit(with: .milli), "ms", "waveform.path.ecg", false),
            (.appleExerciseTime, "運動時間", .minute(), "分", "figure.strengthtraining.traditional", true),
            (.appleStandTime, "站立時間", .minute(), "分", "figure.stand", true),
            (.vo2Max, "心肺適能", HKUnit(from: "ml/kg*min"), "VO₂ max", "lungs", false),
            (.respiratoryRate, "呼吸頻率", HKUnit.count().unitDivided(by: .minute()), "次／分", "wind", false),
            (.oxygenSaturation, "血氧", .percent(), "%", "drop", false),
            (.appleSleepingWristTemperature, "睡眠手腕溫度", .degreeCelsius(), "°C", "thermometer.medium", false),
            (.bodyFatPercentage, "體脂率", .percent(), "%", "figure.arms.open", false)
        ]
        for (id, title, unit, label, icon, daily) in specs where basic.contains(id) || advanced {
            do {
                let sample = try await quantity(id, unit: unit, daily: daily)
                if id == .stepCount { steps = sample?.0 }
                let percent = id == .oxygenSaturation || id == .bodyFatPercentage
                let number = sample.map { $0.0 * (percent ? 100 : 1) }
                result.append(HealthMetric(id: id.rawValue, title: title, value: number.map { $0.formatted(.number.precision(.fractionLength(id == .stepCount || id == .activeEnergyBurned ? 0 : 1))) } ?? "—", unit: label, icon: icon, detail: sample.map { daily ? "今日累計" : "最近：" + $0.1.formatted(date: .abbreviated, time: .shortened) } ?? "尚無資料或未允許讀取"))
            } catch {
                if id == .stepCount { steps = nil }
                self.error = "部分健康資料暫時無法更新，請稍後重試。"
                result.append(HealthMetric(id: id.rawValue, title: title, value: "—", unit: label, icon: icon, detail: "暫時無法讀取"))
            }
        }
        if advanced {
            do {
                let hours = try await sleepHours()
                result.append(HealthMetric(id: "sleep", title: "最近睡眠", value: hours.map { $0.formatted(.number.precision(.fractionLength(1))) } ?? "—", unit: "小時", icon: "moon.zzz.fill", detail: hours == nil ? "尚無資料或未允許讀取" : "過去 24 小時，單一來源去重"))
            } catch { self.error = "睡眠資料暫時無法更新。" }
        }
        metrics = result; updated = .now; loading = false
    }
    private func quantity(_ id: HKQuantityTypeIdentifier, unit: HKUnit, daily: Bool) async throws -> (Double, Date)? {
        let type = HKQuantityType(id)
        if daily {
            let start = Calendar.current.startOfDay(for: .now)
            return try await withCheckedThrowingContinuation { continuation in
                let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: .now), options: .cumulativeSum) { _, stats, error in
                    if let error { continuation.resume(throwing: error); return }
                    continuation.resume(returning: stats?.sumQuantity().map { ($0.doubleValue(for: unit), Date.now) })
                }
                store.execute(query)
            }
        }
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: HKQuery.predicateForSamples(withStart: nil, end: .now), limit: 1, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]) { _, samples, error in
                if let error { continuation.resume(throwing: error); return }
                let sample = samples?.first as? HKQuantitySample
                continuation.resume(returning: sample.map { ($0.quantity.doubleValue(for: unit), $0.endDate) })
            }
            store.execute(query)
        }
    }
    private func sleepHours() async throws -> Double? {
        let end = Date.now; let start = end.addingTimeInterval(-86400)
        let samples: [HKCategorySample] = try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: HKCategoryType(.sleepAnalysis), predicate: HKQuery.predicateForSamples(withStart: start, end: end), limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
                if let error { continuation.resume(throwing: error); return }
                continuation.resume(returning: samples as? [HKCategorySample] ?? [])
            }; store.execute(query)
        }
        let asleep = samples.filter { [HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue, HKCategoryValueSleepAnalysis.asleepCore.rawValue, HKCategoryValueSleepAnalysis.asleepDeep.rawValue, HKCategoryValueSleepAnalysis.asleepREM.rawValue].contains($0.value) }
        let sources = Dictionary(grouping: asleep) { $0.sourceRevision.source.bundleIdentifier }
        // Never sum competing devices or apps: union intervals per source, use the longest available source.
        let totals = sources.values.map { values -> Double in
            let intervals = values.map { (max(start, $0.startDate), min(end, $0.endDate)) }.filter { $0.1 > $0.0 }.sorted { $0.0 < $1.0 }
            var total = 0.0; var previousEnd = start
            for interval in intervals { total += max(0, interval.1.timeIntervalSince(max(previousEnd, interval.0))); previousEnd = max(previousEnd, interval.1) }
            return total / 3600
        }
        return totals.max()
    }
}
struct HealthPage: View {
    @Bindable var health: HealthSummary
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack { Image(systemName: "heart.text.square.fill").font(.largeTitle).foregroundStyle(IronStyle.vermilion); Spacer(); Stamp(text: "日常紀錄") }
                    Text("健康摘要").font(.system(.title2, design: .serif).weight(.bold))
                    Text("從 Apple 健康讀取日常資料，放在訓練記錄旁邊。沒有手錶也可以使用。") .font(.subheadline).foregroundStyle(IronStyle.quietInk)
                    if !health.available { Text("此裝置不支援 Apple 健康。訓練紀錄仍可正常使用。").foregroundStyle(IronStyle.quietInk) }
                    else {
                        Button { Task { await health.connect(includeAdvanced: false) } } label: { Label(health.requested ? "管理基本資料授權" : "連接 Apple 健康", systemImage: "heart.fill").frame(maxWidth: .infinity) }.buttonStyle(.borderedProminent).tint(IronStyle.vermilion).disabled(health.loading)
                        Button { Task { await health.connect(includeAdvanced: true) } } label: { Label("開啟心率、睡眠與更多指標", systemImage: "applewatch") }.font(.subheadline).tint(IronStyle.vermilion).disabled(health.loading)
                    }
                }.paperPanel()
                if health.loading { ProgressView("更新健康資料…").frame(maxWidth: .infinity) }
                if let error = health.error { Text(error).font(.caption).foregroundStyle(.orange) }
                if let date = health.updated { Text("更新於 \(date.formatted(date: .omitted, time: .shortened))").font(.caption).foregroundStyle(.secondary) }
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(health.metrics) { metric in
                        VStack(alignment: .leading, spacing: 8) {
                            PaperPanel { InkMetric(label: metric.title, value: metric.value, unit: metric.unit, icon: metric.icon) }
                            Text(metric.detail).font(.caption2).foregroundStyle(IronStyle.paper.opacity(0.62)).padding(.horizontal, 5)
                        }
                    }
                }
                Text("資料是否可用取決於裝置、地區與你的授權。空白不代表 0；最近一次測量不一定是今天。你可以在 Apple 健康 App 管理讀取權限。").font(.caption).foregroundStyle(IronStyle.paper.opacity(0.62))
                Text("目前僅讀取健康資料，不會自動調整課表或寫入健康紀錄。").font(.caption).foregroundStyle(IronStyle.paper.opacity(0.62))
            }.padding(20)
        }.inkPage().navigationTitle("身體與日常").refreshable { await health.refresh() }
    }
}

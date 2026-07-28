# AIPI 510 Dataset Project

## Summary

This is the final dataset project for AIPI 510, where I have curated a WHOOP dataset. It contains metrics that are collected from the app and a few others that I have added on my own. The additional metrics are from changes that I have made in my lifestyle to see if these have an impact on the other built-in metrics such as sleep. 

The motivation behind this project stems from my sleeping habits. 4 years ago, I was struggling with multiple sleeping issues such as insomnia and sleep paralysis, but I could never figure out what factors in my life contributed to it. A friend of mine introduced me to the WHOOP device to which I immediately purchased to track my sleeping habits. Since then, I have noticed a significant improvement in my sleeping conditions. I, however, never took the time and effort to evaluate habits that might affect my sleep quality, so I decided to use this project as an opportunity to test out different habits. WHOOP already provides a dataset with multiple physiological metrics, but I will be adding on to that by adding data about changes I made to my lifestyle. I have used one month of data as the baseline measurement to compare all my experimental results to. To source the data, I will export the existing dataset out of the app and manually add other columns to show the changes I have made in my habits. The changes I have experimented with so far are drinking a cup of coffee every morning at 9am (I'm not a regular coffee drinker) and drinking a cup of milk right before sleeping (I usually don't control what time of the day I drink milk). Each change was experimented with for a week separately. 

The dataset contains metrics that is measured by the WHOOP app. I have added my own column 'Period' to indicate what time period I use as a baseline measurement and which time periods I'm implementing changes to my lifestyle. Since my focus is on sleep metrics, I have create extra columns that aggregate the sleep metrics from the WHOOP app such as calculating total sleep time or sleep efficiency. 

## Power Analysis

I conducted my power analysis using the G*Power software. I entered in the following parameters into the program:
* Test family: t-tests
* Statistical test: 
* Tails: 2
* Effect size d: 0.5 (medium)
* Significance level (α): 0.05
* Power (1-β): 0.80
* Allocation ratio: 1

The output was a sample size of 64 per group. This means that I will need to test and observe each new habit for 64 days.

Note: I was not able to use the suggested sample size as I had a last minute change to this project with limited time as my original idea fell through. 

## Exploratory Data Analysis

I assessed the data quality through the following lenses using the notebook in the repository:

1. Data Profiling: The data was collected through the WHOOP app and I only included data from October 2024 onwards as this is when I started to measure baseline levels and make changes to my lifestyle. This dataset is biased towards me as it only contains my data. The columns of the dataset are different physiological metrics such as heart rate variability and deep sleep duration. To visualize our data, we used a heatmap to see if there is initially any correlation between any of the metrics. One example is that the correlation between total sleep and sleep efficiency is 0.96 which makes sense as the calculation of sleep efficiency invovles total sleep. The heatmap will help me figure out how my different physiological metrics are related to each other. We also visualize the different sleep related metrics in a box plot across different periods to see how it changes as I make changes to my lifestyle. I also conducted some statistical tests to see if any of the changes were significant. 

2. Data Completeness: The dataset had some missing values, which could be attributed to me forgetting to wear the band or the device running out of battery. To address the missing values, I used the mean method within the time period under the assumption that my metrics stay within the same distribution. Some missing values could not be addressed, so I removed the whole row completely. This was most likely days where I forgot to wear the deivce so there was no data at all. 

3. Data Accuracy: Since the dataset is unique to me, there aren't any other sources that I can cross reference it with. I did, however, compare with health sources to make sure that my metrics were within a reasonable range and that my device wasn't malfunctioning while collecting data. According to ranges I found online, none of the values in my dataset were considered outliers. 

4. Data Consistency: The data was consistent in terms of the format with some minor fluctuations in the values which is expected as I was epxerimenting with changes in my lifestyle. One thing that interfered with consistency was the absence of some dates due to me forgetting to wear the device. These missing values were either filled in or dropped. 

5. Data Integrity: I cross-checked the values in my dataset with reasonable ranges found online and there were no datapoints that deviated significantly from the reasonable range. 

6. Data Lineage & Provenance: Since the dataset only contains values from my metrics, it is biased and only applicable to me. In order to make my findings more generalizable I would need to collect data from other WHOOP users. The missing values were also filled with a specific algorithm which can also introduce bias. Sevearal new features were added such as the change in the lifestyle I made and sevearal aggreagted metrics to visualize the sleep metrics easier. At the end of the EDA, I also reduced the dimensionality through PCA transformation to visualize the first two principal componenets as it accounts for the majority of variance. 

## Ethics Statement

The study involved a single participant (myself) who provided informed consent and had complete autonomy over the lifestyle changes involved. Data was collected using a WHOOP device, which is available commerically. The lifestyle changes such as coffee every morning and milk before sleep was consumed in normal dietary amounts and posed minimal risks to my personal health and wellbeing. If I were to experience any adverse effects, I would stop the new habit immediately and redesign the experimental plan. All data collected is self-owned and controlled by me, which can introduce some bias into the experiment. No external approval was needed as this was a self-experimentation study, where I was aware of the risks associated with the project. If I were to extend this dataset to include data from other individuals, I would need to receive consent from them. I would also need approval from an external board as it involves the health and well being of other individuals. 

## License
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.en)

## Kaggle
[Link to Kaggle Dataset](https://www.kaggle.com/datasets/andrewcxjin/whoop-dataset)
